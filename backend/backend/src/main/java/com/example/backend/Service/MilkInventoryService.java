package com.example.backend.Service;

import com.example.backend.DTO.AddMilkInventoryRequestDto;
import com.example.backend.Entity.User;

public interface MilkInventoryService {
    void addTodayMilk(AddMilkInventoryRequestDto dto, User loggedInUser);
}

