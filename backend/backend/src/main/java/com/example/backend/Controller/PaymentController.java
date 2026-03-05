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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Formatter;
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

    /**
     * Create a Razorpay payment order for a CONFIRMED order.
     * Called by the buyer when they click "Pay Now".
     */
    @PostMapping("/{orderId}/payment/create")
    public ResponseEntity<Map<String, Object>> createPayment(
            @PathVariable Long orderId,
            @AuthenticationPrincipal User user) {

        Orders order = ordersRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        // Ensure the caller is the buyer
        if (!order.getBuyer().getId().equals(user.getId())) {
            throw new IllegalArgumentException("You are not the buyer of this order");
        }

        // Only CONFIRMED orders can be paid for
        if (order.getStatus() != OrderStatus.CONFIRMED) {
            throw new IllegalStateException("Payment is only available for CONFIRMED orders. Current status: " + order.getStatus());
        }

        // If a Razorpay order already exists, return existing details
        if (order.getRazorpayOrderId() != null) {
            return ResponseEntity.ok(Map.of(
                    "razorpayOrderId", order.getRazorpayOrderId(),
                    "amount", Math.round((order.getTotalPrice() != null ? order.getTotalPrice() : 0) * 100),
                    "currency", "INR",
                    "key", razorpayKey,
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

            // Persist the razorpayOrderId
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
     * Verify Razorpay payment signature after buyer completes payment.
     * On success, marks the order as COMPLETED.
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

        String razorpayOrderId  = payload.get("razorpay_order_id");
        String razorpayPaymentId = payload.get("razorpay_payment_id");
        String razorpaySignature = payload.get("razorpay_signature");

        // Verify HMAC-SHA256 signature
        String message = razorpayOrderId + "|" + razorpayPaymentId;
        try {
            String generated = hmacSha256(message, razorpaySecret);
            if (!generated.equals(razorpaySignature)) {
                throw new IllegalStateException("Payment verification failed: signature mismatch");
            }
        } catch (Exception e) {
            throw new IllegalStateException("Payment verification failed: " + e.getMessage());
        }

        // Mark order as COMPLETED and save payment ID
        order.setRazorpayPaymentId(razorpayPaymentId);
        order.setStatus(OrderStatus.COMPLETED);
        ordersRepository.save(order);

        log.info("Payment verified for order {} (paymentId={})", orderId, razorpayPaymentId);

        // Return a basic DTO
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
