# Minimum CMake version required
cmake_minimum_required(VERSION 3.10)

# Set the C and C++ compilers
set(CMAKE_C_COMPILER "C:/msys64/mingw64/bin/gcc.exe")
set(CMAKE_CXX_COMPILER "C:/msys64/mingw64/bin/g++.exe")

# Project name and language
project(raymarching LANGUAGES C CXX)

# Set C++ standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Include directories
include_directories(
    C:/Users/Dell/Documents/C++/one/headers
    C:/imgui
    C:/glad/include
    C:/glfw-3.4.bin.WIN64/include
    C:/glew-2.1.0/include
    C:/glm-1.0.1
)

# Link directories
link_directories(
    C:/glew-2.1.0/lib/Release/x64
    C:/glfw-3.4.bin.WIN64/lib-mingw-w64
)

# Add glad as a static library
if(EXISTS "C:/glad/src/glad.c")
    add_library(glad STATIC C:/glad/src/glad.c)
    target_include_directories(glad PUBLIC C:/glad/include)
else()
    message(FATAL_ERROR "glad.c not found in C:/glad/src/")
endif()

# Add source files
file(GLOB_RECURSE SOURCES
    ${CMAKE_SOURCE_DIR}/main.cpp
    ${CMAKE_SOURCE_DIR}/src/*.cpp
    C:/imgui/*.cpp  # Include all ImGui source files
)

# Create the executable
add_executable(${PROJECT_NAME} ${SOURCES})

# Link libraries
target_link_libraries(${PROJECT_NAME} 
    glad  # Link the GLAD library
    opengl32 
    glew32 
    glfw3dll 
)

# Optional: Set the output directory for binaries
set_target_properties(${PROJECT_NAME} PROPERTIES RUNTIME_OUTPUT_DIRECTORY ${PROJECT_SOURCE_DIR}/)
# set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${SOURCE_DIR})

# Enable verbose output for debugging
set(CMAKE_VERBOSE_MAKEFILE ON)
