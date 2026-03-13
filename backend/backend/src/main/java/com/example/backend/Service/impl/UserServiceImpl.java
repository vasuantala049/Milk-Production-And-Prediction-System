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
        user.setAddress(normalize(dto.getAddress()));
        user.setCity(normalize(dto.getCity()));
        user.setLocation(normalize(dto.getAddress()));
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
                farm.setCity(dto.getFarm().getCity());
                farm.setOwner(user);

                user.setFarms(List.of(farm));
            }

            case WORKER -> {
                throw new IllegalArgumentException(
                        "Public registration for Workers is not allowed. Please ask the Farm Owner to add you.");
            }

            case BUYER -> {
                // nothing extra
            }

            default -> throw new IllegalStateException("Unsupported role");
        }

        User saved = userRepository.save(user);
        return toUserResponse(saved);
    }

    @Override
    public UserResponseDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return toUserResponse(user);
    }

    @Override
    public UserResponseDto updateUser(Long id, CreateUserRequestDto request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setAddress(normalize(request.getAddress()));
        user.setCity(normalize(request.getCity()));
        user.setLocation(normalize(request.getAddress()));

        User saved = userRepository.save(user);
        return toUserResponse(saved);
    }

    @Override
    @Transactional
    public UserResponseDto patchUser(Long id, UserPatchDto patchDto, com.example.backend.Entity.User loggedInUser) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (patchDto.getName() != null) {
            user.setName(patchDto.getName());
        }

        if (patchDto.getEmail() != null) {
            user.setEmail(patchDto.getEmail());
        }

        if (patchDto.getAddress() != null) {
            user.setAddress(normalize(patchDto.getAddress()));
            user.setLocation(normalize(patchDto.getAddress()));
        }

        if (patchDto.getLocation() != null) {
            user.setLocation(patchDto.getLocation());
            if (user.getAddress() == null || user.getAddress().isEmpty()) {
                user.setAddress(normalize(patchDto.getLocation()));
            }
        }

        if (patchDto.getCity() != null) {
            user.setCity(normalize(patchDto.getCity()));
        }

        User saved = userRepository.save(user);
        return toUserResponse(saved);
    }

    private UserResponseDto toUserResponse(User user) {
        UserResponseDto response = modelMapper.map(user, UserResponseDto.class);
        if ((response.getAddress() == null || response.getAddress().isBlank())
                && user.getLocation() != null
                && !user.getLocation().isBlank()) {
            response.setAddress(user.getLocation());
        }
        return response;
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

}
