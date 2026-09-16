<?php
header('Content-Type: application/json; charset=utf-8');
// El cálculo principal de esta versión se realiza en la interfaz para que
// el usuario pueda ingresar y revisar todos los valores manualmente.
echo json_encode(['success'=>true,'message'=>'Cálculos realizados en la interfaz.'], JSON_UNESCAPED_UNICODE);
?>
