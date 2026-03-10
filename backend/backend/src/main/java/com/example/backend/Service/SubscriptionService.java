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

    Subscription approveSubscription(Long subscriptionId, Long farmId, User owner);

    Subscription rejectSubscription(Long subscriptionId, Long farmId, User owner);
}
