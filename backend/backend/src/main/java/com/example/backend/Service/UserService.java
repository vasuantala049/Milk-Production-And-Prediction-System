package com.example.backend.Service;

import com.example.backend.DTO.CreateUserRequestDto;
import com.example.backend.DTO.UserPatchDto;
import com.example.backend.DTO.UserResponseDto;
import jakarta.validation.Valid;

import java.util.List;
import java.util.Map;

public interface UserService {

    UserResponseDto createNewUser(@Valid CreateUserRequestDto request);

    UserResponseDto getUserById(Long id);

    UserResponseDto updateUser(Long id, @Valid CreateUserRequestDto request);

    UserResponseDto patchUser(Long id, UserPatchDto patchDto);
}
