package com.example.backend.Service.impl;

import com.example.backend.DTO.CreateFarmDto;
import com.example.backend.DTO.FarmPatchDto;
import com.example.backend.DTO.FarmResponseDto;
import com.example.backend.Entity.Farm;
import com.example.backend.Entity.User;
import com.example.backend.Entity.type.UserRole;
import com.example.backend.Repository.FarmRepository;
import com.example.backend.Repository.UserRepository;
import com.example.backend.Service.FarmService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;


@Service
@RequiredArgsConstructor
@Transactional
public class FarmServiceImpl implements FarmService {

    private final FarmRepository farmRepository;
    private final UserRepository userRepository;
    private final ModelMapper modelMapper;

    @Override
    public FarmResponseDto createFarm(CreateFarmDto dto) {

        // TEMP: replace with logged-in user later
        Long ownerId = dto.getOwnerId();

        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new IllegalArgumentException("Owner not found"));

        if (owner.getRole() != UserRole.FARM_OWNER) {
            throw new IllegalArgumentException("Only FARM_OWNER can create farms");
        }

        Farm farm = new Farm();
        farm.setName(dto.getName());
        farm.setAddress(dto.getAddress());
        farm.setOwner(owner);

        Farm saved = farmRepository.save(farm);
        return toResponseDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public FarmResponseDto getFarmById(Long id) {

        Farm farm = farmRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Farm not found"));

        return toResponseDto(farm);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FarmResponseDto> getFarmsByOwner(Long ownerId) {

        List<Farm> farms = farmRepository.findByOwnerId(ownerId);

        return farms.stream()
                .map(this::toResponseDto)
                .toList();
    }

    @Override
    public FarmResponseDto patchFarm(Long id, FarmPatchDto patchDto) {

        Farm farm = farmRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Farm not found"));

        // TEMP: replace with logged-in user
        Long loggedInUserId = patchDto.getOwnerId();

        if (!farm.getOwner().getId().equals(loggedInUserId)) {
            throw new IllegalArgumentException("You are not the owner of this farm");
        }

        if (patchDto.getName() != null) {
            farm.setName(patchDto.getName());
        }
        if (patchDto.getOwnerId() == null) {
            throw new IllegalArgumentException("ownerId is required to update farm");
        }

        if (patchDto.getAddress() != null) {
            farm.setAddress(patchDto.getAddress());
        }

        Farm saved = farmRepository.save(farm);
        return toResponseDto(saved);
    }

    @Override
    public List<FarmResponseDto> getFarmsByWorker(Long workerId) {
        User user = userRepository.findById(workerId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (user.getAssignedFarm() == null) {
            throw new IllegalStateException("Worker is not assigned to any farm");
        }
        return List.of(toResponseDto(user.getAssignedFarm()));
    }

    @Override
    public void deleteFarm(Long id) {
        if (!farmRepository.existsById(id)) {
            throw new IllegalArgumentException("Farm not found");
        }
        farmRepository.deleteById(id);
    }

    // ---------- helper ----------
    private FarmResponseDto toResponseDto(Farm farm) {
        FarmResponseDto dto = modelMapper.map(farm, FarmResponseDto.class);
        dto.setOwnerId(farm.getOwner().getId());
        return dto;
    }
}
