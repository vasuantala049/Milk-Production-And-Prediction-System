package com.example.backend.Service;

import com.example.backend.DTO.MilkBuyDto;
import com.example.backend.Entity.Farm;
import com.example.backend.Entity.Subscription;
import com.example.backend.Entity.User;
import com.example.backend.Entity.type.MilkSession;
import com.example.backend.Entity.type.SubscriptionStatus;
import com.example.backend.Repository.SubscriptionRepository;
import com.example.backend.Service.impl.SubscriptionServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SubscriptionServiceTest {

    @Mock
    private SubscriptionRepository subscriptionRepository;

    @Mock
    private BuyMilkService buyMilkService;

    @InjectMocks
    private SubscriptionServiceImpl subscriptionService;

    @Test
    void testGenerateDailyOrders_ActiveSubscription() {
        // Given
        User user = new User();
        user.setId(1L);
        Farm farm = new Farm();
        farm.setId(10L);

        Subscription sub = new Subscription();
        sub.setId(100L);
        sub.setBuyer(user);
        sub.setFarm(farm);
        sub.setQuantity(2.0);
        sub.setSession(MilkSession.MORNING);
        sub.setStartDate(LocalDate.now().minusDays(1)); // Started yesterday
        sub.setStatus(SubscriptionStatus.ACTIVE);

        when(subscriptionRepository.findAllByStatus(SubscriptionStatus.ACTIVE))
                .thenReturn(Collections.singletonList(sub));

        // When
        subscriptionService.generateDailyOrders();

        // Then
        verify(buyMilkService, times(1)).buyMilk(any(MilkBuyDto.class), eq(user));
    }

    @Test
    void testGenerateDailyOrders_FutureSubscription() {
        // Given
        Subscription sub = new Subscription();
        sub.setStartDate(LocalDate.now().plusDays(1)); // Starts tomorrow
        sub.setStatus(SubscriptionStatus.ACTIVE);

        when(subscriptionRepository.findAllByStatus(SubscriptionStatus.ACTIVE))
                .thenReturn(Collections.singletonList(sub));

        // When
        subscriptionService.generateDailyOrders();

        // Then
        verify(buyMilkService, never()).buyMilk(any(), any());
    }
}
