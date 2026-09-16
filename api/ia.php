<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

$configFile = __DIR__ . '/config.php';
if (file_exists($configFile)) {
    require $configFile;
}

$apiKey = getenv('GEMINI_API_KEY') ?: ($GEMINI_API_KEY ?? '');
$model = getenv('GEMINI_MODEL') ?: ($GEMINI_MODEL ?? 'gemini-3.5-flash-lite');

if (!$apiKey) {
    http_response_code(500);
    echo json_encode(['success'=>false,'message'=>'No hay una clave de Gemini configurada. Edita api/config.php y coloca tu GEMINI_API_KEY.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw ?: '', true);
if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['success'=>false,'message'=>'Los datos enviados no tienen un formato válido.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$prompt = <<<PROMPT
Actúa como un analista experto en contabilidad administrativa y Costeo Basado en Actividades (ABC).

Analiza exclusivamente los datos proporcionados por el sistema. No inventes valores, no cambies los cálculos y no propongas nuevos valores como si fueran datos reales.

Tu tarea es entregar un análisis breve pero útil del mes seleccionado. Incluye:
1. Resumen del CIF total y CIF por unidad.
2. Las actividades con mayor y menor costo asignado.
3. Observaciones sobre la concentración de costos entre actividades.
4. Revisión del driver y de la relación entre total driver y horas de actividades. Si son diferentes, indícalo como observación y no lo corrijas por tu cuenta.
5. Actividades repetidas entre pools y su efecto en la consolidación, si los datos lo muestran.
6. Revisión de la verificación: compara CIF asignado con CIF verificado y señala si coincide.
7. Recomendaciones concretas para revisar la calidad de los datos, sin modificar automáticamente ningún valor.

Usa títulos y viñetas. Diferencia claramente entre hechos observados y recomendaciones.

DATOS DEL SISTEMA:
PROMPT;
$prompt .= "\n" . json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

// Usamos la versión v1beta de Interactions con una solicitud simple,
// que es el formato REST documentado actualmente por Google.
$payload = [
    'model' => $model,
    'input' => $prompt,
    'store' => false
];

$jsonPayload = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
if ($jsonPayload === false) {
    http_response_code(500);
    echo json_encode(['success'=>false,'message'=>'No se pudo preparar la solicitud para Gemini.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$url = 'https://generativelanguage.googleapis.com/v1beta/interactions';
$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'x-goog-api-key: ' . $apiKey
    ],
    CURLOPT_POSTFIELDS => $jsonPayload,
    CURLOPT_TIMEOUT => 90,
]);

$response = curl_exec($ch);
$curlError = curl_error($ch);
$status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($response === false || $curlError) {
    http_response_code(502);
    echo json_encode(['success'=>false,'message'=>'No se pudo conectar con Gemini. Verifica que PHP tenga habilitado cURL y que tu equipo tenga conexión a Internet.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$result = json_decode($response, true);
if (!is_array($result)) {
    http_response_code(502);
    echo json_encode(['success'=>false,'message'=>'Gemini devolvió una respuesta que no está en formato JSON válido.'], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($status < 200 || $status >= 300) {
    $message = $result['error']['message'] ?? ('Gemini devolvió HTTP ' . $status . '.');
    http_response_code($status ?: 502);
    echo json_encode(['success'=>false,'message'=>$message], JSON_UNESCAPED_UNICODE);
    exit;
}

// Formato actual: steps[].content[].text
$text = '';
foreach (($result['steps'] ?? []) as $step) {
    if (!is_array($step)) continue;
    if (($step['type'] ?? '') !== 'model_output') continue;
    foreach (($step['content'] ?? []) as $part) {
        if (is_array($part) && isset($part['text']) && is_string($part['text'])) {
            $text .= $part['text'];
        }
    }
}

// Compatibilidad con respuestas anteriores: outputs[].text
if (!$text) {
    foreach (($result['outputs'] ?? []) as $output) {
        if (is_array($output) && isset($output['text']) && is_string($output['text'])) {
            $text .= $output['text'];
        }
    }
}

// Otros formatos posibles de respuesta.
if (!$text && isset($result['output_text']) && is_string($result['output_text'])) {
    $text = $result['output_text'];
}
if (!$text && isset($result['text']) && is_string($result['text'])) {
    $text = $result['text'];
}

$text = trim($text);
if (!$text) {
    $state = $result['status'] ?? 'desconocido';
    $detail = '';
    if ($state === 'failed' && isset($result['error']['message'])) {
        $detail = ' ' . $result['error']['message'];
    } elseif ($state === 'incomplete') {
        $detail = ' La interacción quedó incompleta.';
    } elseif ($state === 'in_progress') {
        $detail = ' La interacción sigue en progreso.';
    }

    http_response_code(502);
    echo json_encode([
        'success'=>false,
        'message'=>'Gemini respondió correctamente, pero no se encontró texto de análisis. Estado: ' . $state . '.' . $detail,
        'debug'=>[
            'http_status'=>$status,
            'model'=>$model,
            'has_steps'=>isset($result['steps']),
            'has_outputs'=>isset($result['outputs'])
        ]
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

echo json_encode([
    'success'=>true,
    'analysis'=>$text,
    'model'=>$model
], JSON_UNESCAPED_UNICODE);
?>
