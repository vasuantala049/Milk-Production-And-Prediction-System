package com.example.backend.Controller;

import com.example.backend.DTO.SubscribeDto;
import com.example.backend.Entity.Subscription;
import com.example.backend.Entity.User;
import com.example.backend.Service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    @PostMapping
    public ResponseEntity<Subscription> subscribe(@RequestBody SubscribeDto dto, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(subscriptionService.subscribe(dto, user));
    }

    @GetMapping("/my-subscriptions")
    public ResponseEntity<List<Subscription>> getMySubscriptions(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(subscriptionService.getMySubscriptions(user));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<Subscription> cancelSubscription(@PathVariable Long id, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(subscriptionService.cancelSubscription(id, user));
    }
}
