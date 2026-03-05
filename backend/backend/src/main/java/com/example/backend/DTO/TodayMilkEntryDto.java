package com.example.backend.DTO;

import com.example.backend.Entity.type.MilkSession;
import lombok.Getter;

@Getter
public class TodayMilkEntryDto {

    private String cattleTagId;
    private String cattleName;
    private String animalType;
    private MilkSession session;
    private Double milkLiters;
    private String workerName;

    public TodayMilkEntryDto() {
    }

    public TodayMilkEntryDto(String cattleTagId, String cattleName, String animalType, MilkSession session, Double milkLiters, String workerName) {
        this.cattleTagId = cattleTagId;
        this.cattleName = cattleName;
        this.animalType = animalType;
        this.session = session;
        this.milkLiters = milkLiters;
        this.workerName = workerName;
    }

    public void setCattleTagId(String cattleTagId) {
        this.cattleTagId = cattleTagId;
    }

    public void setCattleName(String cattleName) {
        this.cattleName = cattleName;
    }

    public void setAnimalType(String animalType) {
        this.animalType = animalType;
    }

    public void setSession(MilkSession session) {
        this.session = session;
    }

    public void setMilkLiters(Double milkLiters) {
        this.milkLiters = milkLiters;
    }

    public void setWorkerName(String workerName) {
        this.workerName = workerName;
    }
}

