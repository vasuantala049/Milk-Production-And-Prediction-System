package com.example.backend.Service;

import com.example.backend.DTO.AddMilkInventoryRequestDto;
import com.example.backend.Entity.User;

public interface MilkInventoryService {
    void addTodayMilk(AddMilkInventoryRequestDto dto, User loggedInUser);
    Double getTodayTotal(Long farmId);
    com.example.backend.DTO.TodayMilkBreakdownDto getTodayBreakdown(Long farmId);
    java.util.List<com.example.backend.DTO.MilkHistoryDto> getLastNDaysMilk(Long farmId, int days);
}

