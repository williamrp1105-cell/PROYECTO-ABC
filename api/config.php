<?php
// Configuración de la Base de Datos (Aiven MySQL)
$DB_HOST = 'mysql-cd0d9bd-williamrp1105-bc41.l.aivencloud.com';
$DB_PORT = '19018';
$DB_USER = 'avnadmin';
$DB_NAME = 'defaultdb';

// Obtener contraseña de forma segura
$DB_PASSWORD = getenv('DB_PASSWORD');
if (empty($DB_PASSWORD)) {
    $DB_PASSWORD = 'TU_PASSWORD_AQUI';
}

// Configuración de Gemini (Oculta para Render)
$GEMINI_API_KEY = getenv('GEMINI_API_KEY');
if (empty($GEMINI_API_KEY)) {
    $GEMINI_API_KEY = 'TU_API_ACA';
}
$GEMINI_MODEL = 'gemini-3.5-flash-lite';

// Función para detectar Python
function autodetectarPython() {
    if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
        exec('where python 2>NUL', $salida, $codigo_estado);
        if ($codigo_estado === 0 && !empty($salida)) {
            $ruta = trim($salida[0]);
            if (file_exists($ruta)) return $ruta;
        }
        return 'python';
    } else {
        exec('which python3 2>/dev/null', $salida, $codigo_estado);
        if ($codigo_estado === 0 && !empty($salida)) return trim($salida[0]);
        return 'python';
    }
}

$PYTHON_PATH = autodetectarPython();
?>