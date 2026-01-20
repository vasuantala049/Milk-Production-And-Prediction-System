package com.example.backend.Service;

import com.example.backend.DTO.SubscribeDto;
import com.example.backend.Entity.Subscription;
import com.example.backend.Entity.User;

import java.util.List;

public interface SubscriptionService {
    Subscription subscribe(SubscribeDto dto, User user);
    Subscription cancelSubscription(Long id, User user);
    List<Subscription> getMySubscriptions(User user);
    void generateDailyOrders();
    // Also adding pause/resume if needed later, but sticking to plan.
}
