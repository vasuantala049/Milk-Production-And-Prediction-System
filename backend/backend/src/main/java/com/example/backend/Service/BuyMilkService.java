package com.example.backend.Service;

import com.example.backend.DTO.MilkBuyDto;
import com.example.backend.DTO.OrderResponseDto;
import com.example.backend.Entity.User;

public interface BuyMilkService {
    OrderResponseDto buyMilk(MilkBuyDto dto, User user);
}
