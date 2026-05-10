<?php
header('Content-Type: application/json');

require_once '../config/database.php';

// Verify POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => false, 'message' => 'Invalid request method']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$reference = $input['reference'] ?? '';
$student_id = $input['student_id'] ?? '';

if (empty($reference) || empty($student_id)) {
    echo json_encode(['status' => false, 'message' => 'Missing payment reference or student ID']);
    exit;
}

// 1. Verify payment with Paystack API
$curl = curl_init();

curl_setopt_array($curl, [
    CURLOPT_URL => "https://api.paystack.co/transaction/verify/" . rawurlencode($reference),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        "accept: application/json",
        "authorization: Bearer " . PAYSTACK_SECRET_KEY,
        "cache-control: no-cache"
    ],
]);

$response = curl_exec($curl);
$err = curl_error($curl);
curl_close($curl);

if ($err) {
    echo json_encode(['status' => false, 'message' => 'Curl error: ' . $err]);
    exit;
}

$tranx = json_decode($response);

if (!$tranx || !$tranx->status) {
    echo json_encode(['status' => false, 'message' => 'API error: ' . $tranx->message]);
    exit;
}

// 2. Process Successful Payment
if ('success' === $tranx->data->status) {
    $amount_paid = $tranx->data->amount / 100; // Convert from kobo to NGN
    $payment_method = $tranx->data->channel;
    $payment_date = date('Y-m-d H:i:s');
    $expiry_date = date('Y-m-d H:i:s', strtotime('+30 days'));

    try {
        $pdo->beginTransaction();

        // Insert into payments table
        $stmt = $pdo->prepare("INSERT INTO payments (student_id, reference, amount, payment_method, status, payment_date, gateway_response) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$student_id, $reference, $amount_paid, $payment_method, 'success', $payment_date, json_encode($tranx->data)]);

        // Update student subscription (upsert)
        $stmt = $pdo->prepare("INSERT INTO student_subscriptions (student_id, current_period_end, status) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE current_period_end = ?, status = ?");
        $stmt->execute([$student_id, $expiry_date, 'active', $expiry_date, 'active']);

        $pdo->commit();

        echo json_encode([
            'status' => true,
            'message' => 'Payment verified successfully',
            'data' => [
                'reference' => $reference,
                'amount' => $amount_paid,
                'expiry_date' => $expiry_date
            ]
        ]);
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(['status' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
} else {
    // Payment failed or abandoned
    echo json_encode(['status' => false, 'message' => 'Payment verification failed. Status: ' . $tranx->data->status]);
}
?>
