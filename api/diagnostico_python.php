<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
$configFile = __DIR__ . '/config.php';
$PYTHON_PATH = '';
if (is_file($configFile)) require_once $configFile;
$path = trim((string)($PYTHON_PATH ?? ''));
$result = [
  'php' => PHP_VERSION,
  'os' => PHP_OS,
  'python_path_configured' => $path !== '',
  'python_path_exists' => $path !== '' ? is_file($path) : false,
  'proc_open_enabled' => function_exists('proc_open'),
  'exec_enabled' => function_exists('exec'),
  'shell_exec_enabled' => function_exists('shell_exec'),
  'pymupdf' => false,
  'python_output' => '',
  'error' => ''
];
if ($path === '' || !is_file($path)) {
  $result['error'] = 'La ruta configurada de Python no existe para Apache: ' . ($path ?: '(vacía)');
  echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT); exit;
}
$script = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'python' . DIRECTORY_SEPARATOR . 'abc_engine.py';
$cmd = '"' . str_replace('"','\\"',$path) . '" -c "import sys, fitz; print(sys.executable); print(\'PYMUPDF_OK\')"';
if (function_exists('proc_open')) {
  $pipes=[]; $proc=@proc_open($cmd,[0=>['pipe','r'],1=>['pipe','w'],2=>['pipe','w']],$pipes,dirname(__DIR__));
  if (is_resource($proc)) {
    fclose($pipes[0]); $out=stream_get_contents($pipes[1]); $err=stream_get_contents($pipes[2]); fclose($pipes[1]); fclose($pipes[2]); $code=proc_close($proc);
    $result['python_output']=trim((string)$out); $result['pymupdf']=strpos($result['python_output'],'PYMUPDF_OK')!==false; if($code!==0)$result['error']=trim((string)$err) ?: 'Python terminó con código '.$code;
  } else $result['error']='Apache no pudo iniciar proc_open con la ruta configurada.';
} elseif (function_exists('shell_exec')) {
  $out=@shell_exec($cmd.' 2>&1'); $result['python_output']=trim((string)$out); $result['pymupdf']=strpos($result['python_output'],'PYMUPDF_OK')!==false; if(!$result['pymupdf'])$result['error']=$result['python_output'];
} else $result['error']='Apache tiene deshabilitadas proc_open y shell_exec.';
$result['success']=$result['pymupdf'];
echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
