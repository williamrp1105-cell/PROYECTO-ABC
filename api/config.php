<?php
// Configuración local de Gemini.
$GEMINI_API_KEY = 'TU_API_ACA';
$GEMINI_MODEL = 'gemini-3.5-flash-lite';

// Función a prueba de errores para detectar Python en XAMPP u otros servidores
function autodetectarPython() {
    if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
        // Usamos exec en lugar de shell_exec y silenciamos errores con 2>NUL
        exec('where python 2>NUL', $salida, $codigo_estado);
        
        // Si el comando fue exitoso y encontró algo
        if ($codigo_estado === 0 && !empty($salida)) {
            $ruta = trim($salida[0]); // Toma la primera ruta encontrada
            if (file_exists($ruta)) {
                return $ruta;
            }
        }
        // Fallback: Si Apache no puede ver la ruta exacta, devolver 'python' 
        // asumiendo que está en el PATH global de Windows del otro usuario.
        return 'python'; 
    } else {
        // Soporte por si alguien lo corre en Mac/Linux
        exec('which python3 2>/dev/null', $salida, $codigo_estado);
        if ($codigo_estado === 0 && !empty($salida)) {
            return trim($salida[0]);
        }
        return 'python';
    }
}

// Asignamos la ruta detectada
$PYTHON_PATH = autodetectarPython();
?>