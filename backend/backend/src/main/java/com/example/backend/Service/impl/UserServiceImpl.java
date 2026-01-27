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
import org.springframework.security.crypto.password.PasswordEncoder;
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
    private final PasswordEncoder passwordEncoder;

    @Override
    public UserResponseDto createNewUser(CreateUserRequestDto dto) {

        User user = new User();
        user.setName(dto.getName());
        user.setEmail(dto.getEmail());
        user.setRole(dto.getRole());
        if (dto.getPassword() != null) {
            user.setPassword(passwordEncoder.encode(dto.getPassword()));
        }

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
                // Worker can be created without being assigned to a farm.
                if (dto.getFarmId() != null) {
                    Farm farm = farmRepository.findById(dto.getFarmId())
                            .orElseThrow(() -> new IllegalArgumentException("Farm not found"));
                    java.util.List<Farm> farms = new java.util.ArrayList<>();
                    farms.add(farm);
                    user.setAssignedFarms(farms);
                }
                // worker created without farm; no code generation required
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
    public UserResponseDto patchUser(Long id, UserPatchDto patchDto, com.example.backend.Entity.User loggedInUser) {

        User user = userRepository.findByIdWithAssignedFarms(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (patchDto.getName() != null) {
            user.setName(patchDto.getName());
        }

        if (patchDto.getEmail() != null) {
            user.setEmail(patchDto.getEmail());
        }

        if (patchDto.getLocation() != null) {
            user.setLocation(patchDto.getLocation());
        }

        if (patchDto.getCity() != null) {
            user.setCity(patchDto.getCity());
            // Keep legacy "location" in sync so existing code continues to work
            if (user.getLocation() == null || user.getLocation().isEmpty()) {
                user.setLocation(patchDto.getCity());
            }
        }

        // Only WORKER can be (re)assigned to a farm
        if (patchDto.getFarmId() != null) {

            if (user.getRole() != UserRole.WORKER) {
                throw new IllegalArgumentException("Only WORKER can be assigned to a farm");
            }

            Farm farm = farmRepository.findById(patchDto.getFarmId())
                    .orElseThrow(() -> new IllegalArgumentException("Farm not found"));

            // Only the owner of the farm can assign workers to it
            if (loggedInUser.getRole() != UserRole.FARM_OWNER || !farm.getOwner().getId().equals(loggedInUser.getId())) {
                throw new IllegalArgumentException("Only the farm owner can assign workers to this farm");
            }

            java.util.List<Farm> assigned = user.getAssignedFarms();
            if (assigned == null) {
                assigned = new java.util.ArrayList<>();
                user.setAssignedFarms(assigned);
            }
            boolean alreadyAssigned = assigned.stream().anyMatch(f -> f.getId().equals(farm.getId()));
            if (!alreadyAssigned) {
                assigned.add(farm);
            }
        }

        User saved = userRepository.save(user);
        return modelMapper.map(saved, UserResponseDto.class);
    }

}
