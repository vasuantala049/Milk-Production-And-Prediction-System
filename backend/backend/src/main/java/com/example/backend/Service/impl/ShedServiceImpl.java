package com.example.backend.Service.impl;

import com.example.backend.DTO.CreateShedDto;
import com.example.backend.DTO.ShedResponseDto;
import com.example.backend.Entity.Farm;
import com.example.backend.Entity.Shed;
import com.example.backend.Entity.User;
import com.example.backend.Entity.type.UserRole;
import com.example.backend.Repository.FarmRepository;
import com.example.backend.Repository.ShedRepository;
import com.example.backend.Service.ShedService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ShedServiceImpl implements ShedService {

    private final ShedRepository shedRepository;
    private final FarmRepository farmRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ShedResponseDto> getShedsForFarm(Long farmId) {
        return shedRepository.findByFarmId(farmId).stream()
                .map(s -> new ShedResponseDto(s.getId(), s.getName()))
                .toList();
    }

    @Override
    public ShedResponseDto createShed(CreateShedDto dto, User owner) {
        Farm farm = farmRepository.findById(dto.getFarmId())
                .orElseThrow(() -> new IllegalArgumentException("Farm not found"));

        if (!farm.getOwner().getId().equals(owner.getId())) {
            throw new IllegalArgumentException("Only the farm owner can manage sheds");
        }

        String trimmedName = dto.getName().trim();
        if (trimmedName.isEmpty()) {
            throw new IllegalArgumentException("Shed name cannot be blank");
        }

        // Prevent duplicates (case-insensitive)
        boolean exists = shedRepository.findByFarmId(farm.getId()).stream()
                .anyMatch(s -> s.getName().equalsIgnoreCase(trimmedName));
        if (exists) {
            throw new IllegalArgumentException("A shed with this name already exists in this farm");
        }

        Shed shed = new Shed();
        shed.setFarm(farm);
        shed.setName(trimmedName);
        Shed saved = shedRepository.save(shed);
        return new ShedResponseDto(saved.getId(), saved.getName());
    }

    @Override
    public void deleteShed(Long shedId, User owner) {
        Shed shed = shedRepository.findById(shedId)
                .orElseThrow(() -> new IllegalArgumentException("Shed not found"));

        if (!shed.getFarm().getOwner().getId().equals(owner.getId())) {
            throw new IllegalArgumentException("Only the farm owner can delete sheds");
        }

        shedRepository.deleteById(shedId);
    }
}
