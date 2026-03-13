package com.example.backend.Controller;

import com.example.backend.DTO.SubscribeDto;
import com.example.backend.DTO.SubscriptionPaymentRequestDto;
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
            @RequestBody(required = false) SubscriptionPaymentRequestDto request,
            @AuthenticationPrincipal User user) {
        Subscription subscription = subscriptionService.cancelSubscription(
                id,
                request != null ? request.getAmount() : null,
                user);
        return ResponseEntity.ok(mapToDto(subscription));
    }

    @PostMapping("/{id}/skip-today")
    public ResponseEntity<SubscriptionResponseDto> skipToday(@PathVariable Long id,
            @AuthenticationPrincipal User user) {
        Subscription subscription = subscriptionService.skipToday(id, user);
        return ResponseEntity.ok(mapToDto(subscription));
    }

    @PostMapping("/{id}/pay-cycle")
    public ResponseEntity<SubscriptionResponseDto> paySubscriptionCycle(@PathVariable Long id,
            @RequestBody SubscriptionPaymentRequestDto request,
            @AuthenticationPrincipal User user) {
        Subscription subscription = subscriptionService.paySubscriptionCycle(id, request.getAmount(), user);
        return ResponseEntity.ok(mapToDto(subscription));
    }

    /**
     * Approve subscription - farm-scoped endpoint
     * Owner can only approve subscriptions for their own farms
     */
    @PostMapping("/farm/{farmId}/{subscriptionId}/approve")
    public ResponseEntity<SubscriptionResponseDto> approveSubscription(
            @PathVariable Long farmId,
            @PathVariable Long subscriptionId,
            @AuthenticationPrincipal User user) {
        Subscription subscription = subscriptionService.approveSubscription(subscriptionId, farmId, user);
        return ResponseEntity.ok(mapToDto(subscription));
    }

    /**
     * Reject subscription - farm-scoped endpoint
     * Owner can only reject subscriptions for their own farms
     */
    @PostMapping("/farm/{farmId}/{subscriptionId}/reject")
    public ResponseEntity<SubscriptionResponseDto> rejectSubscription(
            @PathVariable Long farmId,
            @PathVariable Long subscriptionId,
            @AuthenticationPrincipal User user) {
        Subscription subscription = subscriptionService.rejectSubscription(subscriptionId, farmId, user);
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
                .displayCode(resolveDisplayCode(subscription))
                .buyerId(subscription.getBuyer() != null ? subscription.getBuyer().getId() : null)
                .buyerName(subscription.getBuyer() != null ? subscription.getBuyer().getName() : null)
                .buyerAddress(resolveBuyerAddress(subscription))
                .buyerCity(subscription.getBuyer() != null ? subscription.getBuyer().getCity() : null)
                .farmId(subscription.getFarm() != null ? subscription.getFarm().getId() : null)
                .farmName(subscription.getFarm() != null ? subscription.getFarm().getName() : null)
                .quantity(subscription.getQuantity())
                .session(subscription.getSession())
                .startDate(subscription.getStartDate())
                .endDate(subscription.getEndDate())
                .skipDate(subscription.getSkipDate())
                .status(subscription.getStatus())
                .animalType(subscription.getAnimalType())
                .billingDayCounter(normalizeCounter(subscription.getBillingDayCounter()))
                .maxBillingDays(30)
                .paymentRequired(normalizeCounter(subscription.getBillingDayCounter()) >= 30)
                .billingAmountDue(calculateBillingAmountDue(subscription))
                .lastCyclePaidAt(subscription.getLastCyclePaidAt())
                .build();
    }

    private int normalizeCounter(Integer counter) {
        if (counter == null || counter < 0) {
            return 0;
        }
        return Math.min(counter, 30);
    }

    private double calculateBillingAmountDue(Subscription subscription) {
        double pricePerLiter = resolvePricePerLiter(subscription);
        return normalizeCounter(subscription.getBillingDayCounter()) *
                (subscription.getQuantity() == null ? 0.0 : subscription.getQuantity()) *
                pricePerLiter;
    }

    private double resolvePricePerLiter(Subscription subscription) {
        if (subscription.getFarm() == null) {
            return 0.0;
        }

        String animalType = subscription.getAnimalType();
        if (animalType == null) {
            return subscription.getFarm().getPricePerLiter() == null ? 0.0 : subscription.getFarm().getPricePerLiter();
        }

        if ("COW".equalsIgnoreCase(animalType) && subscription.getFarm().getCowPrice() != null) {
            return subscription.getFarm().getCowPrice();
        }
        if ("BUFFALO".equalsIgnoreCase(animalType) && subscription.getFarm().getBuffaloPrice() != null) {
            return subscription.getFarm().getBuffaloPrice();
        }
        if ("SHEEP".equalsIgnoreCase(animalType) && subscription.getFarm().getSheepPrice() != null) {
            return subscription.getFarm().getSheepPrice();
        }
        if ("GOAT".equalsIgnoreCase(animalType) && subscription.getFarm().getGoatPrice() != null) {
            return subscription.getFarm().getGoatPrice();
        }
        return subscription.getFarm().getPricePerLiter() == null ? 0.0 : subscription.getFarm().getPricePerLiter();
    }

    private String resolveDisplayCode(Subscription subscription) {
        if (subscription.getDisplayCode() != null && !subscription.getDisplayCode().isBlank()) {
            return subscription.getDisplayCode();
        }
        return String.format("%06d", subscription.getId());
    }

    private String resolveBuyerAddress(Subscription subscription) {
        if (subscription.getBuyer() == null) {
            return null;
        }
        if (subscription.getBuyer().getAddress() != null && !subscription.getBuyer().getAddress().isBlank()) {
            return subscription.getBuyer().getAddress();
        }
        return subscription.getBuyer().getLocation();
    }
}
