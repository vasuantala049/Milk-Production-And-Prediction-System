package com.example.backend.Service.impl;

import com.example.backend.DTO.CreateUserRequestDto;
import com.example.backend.DTO.UserPatchDto;
import com.example.backend.DTO.UserResponseDto;
import com.example.backend.Entity.Farm;
import com.example.backend.Entity.User;
import com.example.backend.Entity.type.UserRole;
import com.example.backend.Repository.FarmRepository;
import com.example.backend.Repository.UserRepository;
import com.example.backend.Service.UserService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
@Service
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final FarmRepository farmRepository;
    private final ModelMapper modelMapper;

    @Override
    public UserResponseDto createNewUser(CreateUserRequestDto dto) {

        User user = new User();
        user.setName(dto.getName());
        user.setEmail(dto.getEmail());
        user.setRole(dto.getRole());

        switch (dto.getRole()) {

            case FARM_OWNER -> {
                if (dto.getFarm() == null) {
                    throw new IllegalArgumentException("OWNER must create a farm");
                }

                Farm farm = new Farm();
                farm.setName(dto.getFarm().getName());
                farm.setAddress(dto.getFarm().getAddress());
                farm.setOwner(user);

                user.setFarms(List.of(farm));
            }

            case WORKER -> {
                if (dto.getFarmId() == null) {
                    throw new IllegalArgumentException("WORKER must be assigned to a farm");
                }

                Farm farm = farmRepository.findById(dto.getFarmId())
                        .orElseThrow(() -> new IllegalArgumentException("Farm not found"));

                user.setAssignedFarm(farm);
            }

            case BUYER -> {
                // nothing extra
            }

            default -> throw new IllegalStateException("Unsupported role");
        }

        User saved = userRepository.save(user);
        return modelMapper.map(saved, UserResponseDto.class);
    }

    @Override
    public UserResponseDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return modelMapper.map(user, UserResponseDto.class);
    }

    @Override
    public UserResponseDto updateUser(Long id, CreateUserRequestDto request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setName(request.getName());
        user.setEmail(request.getEmail());

        User saved = userRepository.save(user);
        return modelMapper.map(saved, UserResponseDto.class);
    }

    @Override
    @Transactional
    public UserResponseDto patchUser(Long id, UserPatchDto patchDto) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (patchDto.getName() != null) {
            user.setName(patchDto.getName());
        }

        if (patchDto.getEmail() != null) {
            user.setEmail(patchDto.getEmail());
        }

        // Only WORKER can be (re)assigned to a farm
        if (patchDto.getFarmId() != null) {

            if (user.getRole() != UserRole.WORKER) {
                throw new IllegalArgumentException("Only WORKER can be assigned to a farm");
            }

            Farm farm = farmRepository.findById(patchDto.getFarmId())
                    .orElseThrow(() -> new IllegalArgumentException("Farm not found"));

            user.setAssignedFarm(farm);
        }

        User saved = userRepository.save(user);
        return modelMapper.map(saved, UserResponseDto.class);
    }

}
