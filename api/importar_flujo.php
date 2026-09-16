<?php
// PDF IMPORT V12 - JSON UTF-8 robusto
ob_start();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

function json_response($payload, $status = 200) {
    if (ob_get_level()) { ob_clean(); }
    http_response_code($status);
    $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    if ($json === false) {
        $json = '{"success":false,"message":"No se pudo generar JSON en PHP.","server_module_version":"PDF_IMPORT_V11"}';
    }
    echo $json;
    exit;
}

register_shutdown_function(function () {
    $e = error_get_last();
    if ($e && in_array($e['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        if (ob_get_level()) { ob_clean(); }
        http_response_code(500);
        echo json_encode([
            'success'=>false,
            'message'=>'Error fatal de PHP: '.$e['message'],
            'file'=>$e['file'],
            'line'=>$e['line'],
            'server_module_version'=>'PDF_IMPORT_V14'
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    }
});

try {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        json_response(['success'=>false,'message'=>'Método no permitido.','server_module_version'=>'PDF_IMPORT_V14']);
    }

    $configFile = __DIR__ . '/config.php';
    $PYTHON_PATH = '';
    if (is_file($configFile)) {
        require_once $configFile;
    }
    $python = trim((string)($PYTHON_PATH ?? ''));

    if (!isset($_FILES['pdf'])) {
        json_response(['success'=>false,'message'=>'No se recibió ningún archivo PDF.','server_module_version'=>'PDF_IMPORT_V14']);
    }

    $file = $_FILES['pdf'];
    $uploadError = (int)($file['error'] ?? UPLOAD_ERR_NO_FILE);
    if ($uploadError !== UPLOAD_ERR_OK) {
        json_response([
            'success'=>false,
            'message'=>'Error al subir el PDF. Código: '.$uploadError,
            'upload_error'=>$uploadError,
            'server_module_version'=>'PDF_IMPORT_V14'
        ]);
    }

    $name = (string)($file['name'] ?? 'archivo.pdf');
    if (strtolower(pathinfo($name, PATHINFO_EXTENSION)) !== 'pdf') {
        json_response(['success'=>false,'message'=>'El archivo debe ser PDF.','server_module_version'=>'PDF_IMPORT_V14']);
    }

    if ($python === '' || !is_file($python)) {
        json_response([
            'success'=>false,
            'message'=>'No se encontró el ejecutable de Python configurado.',
            'python_path'=>$python,
            'server_module_version'=>'PDF_IMPORT_V14'
        ]);
    }

    $script = realpath(__DIR__ . '/../python/parse_flujo_pdf.py');
    if ($script === false || !is_file($script)) {
        json_response(['success'=>false,'message'=>'No se encontró python/parse_flujo_pdf.py.','server_module_version'=>'PDF_IMPORT_V14'],500);
    }

    $tmp = tempnam(sys_get_temp_dir(), 'abc_pdf_');
    if ($tmp === false) {
        json_response(['success'=>false,'message'=>'No se pudo crear un archivo temporal.','server_module_version'=>'PDF_IMPORT_V14'],500);
    }

    if (!move_uploaded_file($file['tmp_name'], $tmp)) {
        @unlink($tmp);
        json_response(['success'=>false,'message'=>'PHP recibió el archivo pero no pudo moverlo al temporal.','server_module_version'=>'PDF_IMPORT_V14'],500);
    }

    // En Windows, proc_open recibe correctamente un comando entre comillas.
    $q = function($v) {
        return '"' . str_replace('"', '\"', (string)$v) . '"';
    };
    $cmd = $q($python) . ' ' . $q($script) . ' ' . $q($tmp);

    $stdout = '';
    $stderr = '';
    $exitCode = -1;

    if (function_exists('proc_open')) {
        $descriptors = [
            0 => ['pipe','r'],
            1 => ['pipe','w'],
            2 => ['pipe','w']
        ];
        $pipes = [];
        $proc = @proc_open($cmd, $descriptors, $pipes, dirname(__DIR__));
        if (!is_resource($proc)) {
            @unlink($tmp);
            json_response([
                'success'=>false,
                'message'=>'PHP no pudo iniciar Python mediante proc_open.',
                'command'=>$cmd,
                'python_path'=>$python,
                'server_module_version'=>'PDF_IMPORT_V14'
            ],500);
        }
        @fclose($pipes[0]);
        $stdout = stream_get_contents($pipes[1]);
        $stderr = stream_get_contents($pipes[2]);
        @fclose($pipes[1]);
        @fclose($pipes[2]);
        $exitCode = proc_close($proc);
    } elseif (function_exists('shell_exec')) {
        $stdout = (string)@shell_exec($cmd . ' 2>&1');
        $exitCode = 0;
    } else {
        @unlink($tmp);
        json_response(['success'=>false,'message'=>'Apache tiene deshabilitadas proc_open y shell_exec.','server_module_version'=>'PDF_IMPORT_V14'],500);
    }

    @unlink($tmp);

    $raw = trim($stdout);
    // Python V13 emits ASCII-only JSON (Unicode is escaped), so this avoids
    // Windows code-page/UTF-8 conversion problems between Apache and Python.
    $data = json_decode($raw, true);
    if (!is_array($data) && function_exists('mb_convert_encoding')) {
        $utf8 = @mb_convert_encoding($raw, 'UTF-8', 'Windows-1252');
        $data = json_decode($utf8, true);
    }

    // Si Python escribió advertencias antes del JSON, extraer únicamente el objeto JSON.
    if (!is_array($data)) {
        $start = strpos($raw, '{');
        $end = strrpos($raw, '}');
        if ($start !== false && $end !== false && $end > $start) {
            $candidate = substr($raw, $start, $end - $start + 1);
            $data = json_decode($candidate, true);
        }
    }

    if (!is_array($data)) {
        json_response([
            'success'=>false,
            'message'=>'Python no devolvió un JSON válido.',
            'python_exit_code'=>$exitCode,
            'python_stdout'=>$stdout,
            'python_stderr'=>$stderr,
            'python_path'=>$python,
            'script'=>$script,
            'server_module_version'=>'PDF_IMPORT_V14'
        ]);
    }

    $data['server_module_version'] = 'PDF_IMPORT_V14';
    $data['python_exit_code'] = $exitCode;
    if (!isset($data['python_stderr'])) $data['python_stderr'] = $stderr;
    json_response($data);
} catch (Throwable $e) {
    json_response([
        'success'=>false,
        'message'=>'Excepción en importar_flujo.php: '.$e->getMessage(),
        'file'=>$e->getFile(),
        'line'=>$e->getLine(),
        'server_module_version'=>'PDF_IMPORT_V14'
    ],500);
}
