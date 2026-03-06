package com.example.backend.Controller;

import com.example.backend.DTO.OrderResponseDto;
import com.example.backend.Entity.Orders;
import com.example.backend.Entity.User;
import com.example.backend.Entity.type.OrderStatus;
import com.example.backend.Repository.OrdersRepository;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Formatter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final OrdersRepository ordersRepository;

    @Value("${razorpay.api.key}")
    private String razorpayKey;

    @Value("${razorpay.api.secret}")
    private String razorpaySecret;

    /** MORNING slots close at 10:00 AM, EVENING slots close at 8:00 PM */
    private static final LocalTime MORNING_CUTOFF = LocalTime.of(10, 0);
    private static final LocalTime EVENING_CUTOFF = LocalTime.of(20, 0);

    /**
     * Returns the payment deadline (LocalDateTime) for a given order.
     * MORNING -> orderDate at 10:00, EVENING -> orderDate at 20:00
     */
    private LocalDateTime paymentDeadline(Orders order) {
        LocalDate date = order.getOrderDate();
        LocalTime cutoff = (order.getSession() != null &&
                order.getSession().toString().equalsIgnoreCase("EVENING"))
                ? EVENING_CUTOFF : MORNING_CUTOFF;
        return date.atTime(cutoff);
    }

    /**
     * Returns deadline info for the frontend countdown.
     */
    @GetMapping("/{orderId}/payment/deadline")
    public ResponseEntity<Map<String, Object>> getDeadline(
            @PathVariable Long orderId,
            @AuthenticationPrincipal User user) {

        Orders order = ordersRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (!order.getBuyer().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Access denied");
        }

        LocalDateTime deadline = paymentDeadline(order);
        boolean expired = LocalDateTime.now().isAfter(deadline);

        return ResponseEntity.ok(Map.of(
                "deadline", deadline.toString(),
                "expired", expired,
                "session", order.getSession() != null ? order.getSession().toString() : "MORNING"
        ));
    }

    /**
     * Scheduled task: every 5 minutes auto-cancel CONFIRMED orders whose payment window has passed.
     */
    @Scheduled(fixedRate = 300_000)
    public void autoCancelExpiredOrders() {
        List<Orders> confirmed = ordersRepository.findAll().stream()
                .filter(o -> o.getStatus() == OrderStatus.CONFIRMED
                        && o.getRazorpayPaymentId() == null)
                .toList();

        LocalDateTime now = LocalDateTime.now();
        for (Orders o : confirmed) {
            if (now.isAfter(paymentDeadline(o))) {
                o.setStatus(OrderStatus.CANCELLED);
                ordersRepository.save(o);
                log.info("Auto-cancelled expired CONFIRMED order {} (slot {} on {})",
                        o.getId(), o.getSession(), o.getOrderDate());
            }
        }
    }

    /**
     * Create a Razorpay payment order for a CONFIRMED order.
     */
    @PostMapping("/{orderId}/payment/create")
    public ResponseEntity<Map<String, Object>> createPayment(
            @PathVariable Long orderId,
            @AuthenticationPrincipal User user) {

        Orders order = ordersRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (!order.getBuyer().getId().equals(user.getId())) {
            throw new IllegalArgumentException("You are not the buyer of this order");
        }

        // Check slot expiry FIRST
        LocalDateTime deadline = paymentDeadline(order);
        if (LocalDateTime.now().isAfter(deadline)) {
            if (order.getStatus() == OrderStatus.CONFIRMED) {
                order.setStatus(OrderStatus.CANCELLED);
                ordersRepository.save(order);
                log.info("Order {} auto-cancelled at payment attempt: slot expired", orderId);
            }
            String session = order.getSession() != null ? order.getSession().toString() : "";
            throw new IllegalStateException(
                    "Payment window has expired. The " + session +
                    " session closed at " + deadline.toLocalTime() +
                    " on " + deadline.toLocalDate() + ". You cannot pay for this order anymore.");
        }

        if (order.getStatus() != OrderStatus.CONFIRMED) {
            throw new IllegalStateException("Payment is only available for CONFIRMED orders. Current status: " + order.getStatus());
        }

        // Idempotent: if Razorpay order already exists return cached details
        if (order.getRazorpayOrderId() != null) {
            return ResponseEntity.ok(Map.of(
                    "razorpayOrderId", order.getRazorpayOrderId(),
                    "amount", Math.round((order.getTotalPrice() != null ? order.getTotalPrice() : 0) * 100),
                    "currency", "INR",
                    "key", razorpayKey.trim(),
                    "orderId", order.getId(),
                    "farmName", order.getFarmName() != null ? order.getFarmName() : "",
                    "buyerName", order.getBuyerName() != null ? order.getBuyerName() : ""
            ));
        }

        try {
            String key = razorpayKey.trim();
            String secret = razorpaySecret.trim();
            RazorpayClient client = new RazorpayClient(key, secret);

            long amountInPaise = Math.round((order.getTotalPrice() != null ? order.getTotalPrice() : 0) * 100);

            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amountInPaise);
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "order_" + orderId);
            orderRequest.put("payment_capture", 1);

            com.razorpay.Order razorpayOrder = client.orders.create(orderRequest);
            String razorpayOrderId = razorpayOrder.get("id");

            order.setRazorpayOrderId(razorpayOrderId);
            ordersRepository.save(order);

            log.info("Created Razorpay order {} for order {}", razorpayOrderId, orderId);

            return ResponseEntity.ok(Map.of(
                    "razorpayOrderId", razorpayOrderId,
                    "amount", amountInPaise,
                    "currency", "INR",
                    "key", key,
                    "orderId", order.getId(),
                    "farmName", order.getFarmName() != null ? order.getFarmName() : "",
                    "buyerName", order.getBuyerName() != null ? order.getBuyerName() : ""
            ));
        } catch (RazorpayException e) {
            log.error("Razorpay error creating order: {}", e.getMessage());
            throw new IllegalStateException("Payment gateway error: " + e.getMessage());
        }
    }

    /**
     * Verify Razorpay payment signature. Marks order as COMPLETED on success.
     */
    @PostMapping("/{orderId}/payment/verify")
    public ResponseEntity<OrderResponseDto> verifyPayment(
            @PathVariable Long orderId,
            @RequestBody Map<String, String> payload,
            @AuthenticationPrincipal User user) {

        Orders order = ordersRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (!order.getBuyer().getId().equals(user.getId())) {
            throw new IllegalArgumentException("You are not the buyer of this order");
        }

        // Edge-case: expiry check even at verify step
        if (LocalDateTime.now().isAfter(paymentDeadline(order))) {
            throw new IllegalStateException("Payment window expired. Cannot complete this payment.");
        }

        String razorpayOrderId   = payload.get("razorpay_order_id");
        String razorpayPaymentId = payload.get("razorpay_payment_id");
        String razorpaySignature = payload.get("razorpay_signature");

        String message = razorpayOrderId + "|" + razorpayPaymentId;
        try {
            String generated = hmacSha256(message, razorpaySecret.trim());
            if (!generated.equals(razorpaySignature)) {
                throw new IllegalStateException("Payment verification failed: signature mismatch");
            }
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException("Payment verification failed: " + e.getMessage());
        }

        order.setRazorpayPaymentId(razorpayPaymentId);
        order.setStatus(OrderStatus.COMPLETED);
        ordersRepository.save(order);

        log.info("Payment verified for order {} (paymentId={})", orderId, razorpayPaymentId);

        OrderResponseDto dto = new OrderResponseDto();
        dto.setId(order.getId());
        dto.setStatus(order.getStatus());
        dto.setFarmName(order.getFarmName());
        dto.setTotalPrice(order.getTotalPrice());
        dto.setRazorpayOrderId(razorpayOrderId);
        return ResponseEntity.ok(dto);
    }

    private String hmacSha256(String data, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] rawHmac = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        Formatter formatter = new Formatter();
        for (byte b : rawHmac) {
            formatter.format("%02x", b);
        }
        return formatter.toString();
    }
}
