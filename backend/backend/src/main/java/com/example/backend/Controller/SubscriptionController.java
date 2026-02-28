package com.example.backend.Controller;

import com.example.backend.DTO.SubscribeDto;
import com.example.backend.DTO.SubscriptionResponseDto;
import com.example.backend.Entity.Subscription;
import com.example.backend.Entity.User;
import com.example.backend.Entity.type.SubscriptionStatus;
import com.example.backend.Repository.SubscriptionRepository;
import com.example.backend.Service.FarmAccessService;
import com.example.backend.Service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;
    private final SubscriptionRepository subscriptionRepository;
    private final FarmAccessService farmAccessService;

    @PostMapping
    public ResponseEntity<SubscriptionResponseDto> subscribe(@RequestBody SubscribeDto dto,
            @AuthenticationPrincipal User user) {
        Subscription subscription = subscriptionService.subscribe(dto, user);
        return ResponseEntity.ok(mapToDto(subscription));
    }

    @GetMapping("/my-subscriptions")
    public ResponseEntity<List<SubscriptionResponseDto>> getMySubscriptions(@AuthenticationPrincipal User user) {
        List<Subscription> subscriptions = subscriptionService.getMySubscriptions(user);
        List<SubscriptionResponseDto> dtos = subscriptions.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<SubscriptionResponseDto> cancelSubscription(@PathVariable Long id,
            @AuthenticationPrincipal User user) {
        Subscription subscription = subscriptionService.cancelSubscription(id, user);
        return ResponseEntity.ok(mapToDto(subscription));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<SubscriptionResponseDto> approveSubscription(@PathVariable Long id,
            @AuthenticationPrincipal User user) {
        Subscription subscription = subscriptionService.approveSubscription(id, user);
        return ResponseEntity.ok(mapToDto(subscription));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<SubscriptionResponseDto> rejectSubscription(@PathVariable Long id,
            @AuthenticationPrincipal User user) {
        Subscription subscription = subscriptionService.rejectSubscription(id, user);
        return ResponseEntity.ok(mapToDto(subscription));
    }

    /**
     * Get all subscriptions for a specific farm (owner only)
     */
    @GetMapping("/farm/{farmId}")
    public ResponseEntity<List<SubscriptionResponseDto>> getFarmSubscriptions(
            @PathVariable Long farmId,
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        // Verify user has access to this farm
        farmAccessService.verifyFarmAccess(user, farmId);

        List<Subscription> subscriptions;
        if (page != null && size != null) {
            Pageable pageable = PageRequest.of(page, size);
            Page<Subscription> subPage = subscriptionRepository.findByFarm_Id(farmId, pageable);
            subscriptions = subPage.getContent();
        } else {
            subscriptions = subscriptionRepository.findByFarm_Id(farmId);
        }

        List<SubscriptionResponseDto> dtos = subscriptions.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    /**
     * Get subscriptions for a farm filtered by status
     */
    @GetMapping("/farm/{farmId}/status/{status}")
    public ResponseEntity<List<SubscriptionResponseDto>> getFarmSubscriptionsByStatus(
            @PathVariable Long farmId,
            @PathVariable SubscriptionStatus status,
            @AuthenticationPrincipal User user) {
        // Verify user has access to this farm
        farmAccessService.verifyFarmAccess(user, farmId);

        List<Subscription> subscriptions = subscriptionRepository.findByFarm_IdAndStatus(farmId, status);
        List<SubscriptionResponseDto> dtos = subscriptions.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    private SubscriptionResponseDto mapToDto(Subscription subscription) {
        return SubscriptionResponseDto.builder()
                .id(subscription.getId())
                .buyerId(subscription.getBuyer() != null ? subscription.getBuyer().getId() : null)
                .buyerName(subscription.getBuyer() != null ? subscription.getBuyer().getName() : null)
                .farmId(subscription.getFarm() != null ? subscription.getFarm().getId() : null)
                .farmName(subscription.getFarm() != null ? subscription.getFarm().getName() : null)
                .quantity(subscription.getQuantity())
                .session(subscription.getSession())
                .startDate(subscription.getStartDate())
                .endDate(subscription.getEndDate())
                .status(subscription.getStatus())
                .build();
    }
}
