package com.example.backend_imdf_ctu.exception;

import com.example.backend_imdf_ctu.dto.response.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.LocalDateTime;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    // Xử lý lỗi nghiệp vụ, trả về mã lỗi và thông báo chi tiết
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusinessException(
        BusinessException ex,
        HttpServletRequest request
    ) {

        ErrorCode errorCode = ex.getErrorCode();

        ErrorResponse response = ErrorResponse.builder()
            .timestamp(LocalDateTime.now())
            .status(errorCode.getStatus())
            .code(errorCode.name())
            .message(ex.getMessage())
            .path(request.getRequestURI())
            .build();

        return ResponseEntity
            .status(errorCode.getStatus())
            .body(response);
    }

    // Xử lý lỗi validation, trả về 400 với thông báo chi tiết
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(
        MethodArgumentNotValidException ex,
        HttpServletRequest request
    ) {

        String message = ex.getBindingResult()
            .getFieldErrors()
            .stream()
            .map(error ->
                error.getField() + ": " + error.getDefaultMessage()
            )
            .findFirst()
            .orElse("Dữ liệu không hợp lệ");

        ErrorResponse response = ErrorResponse.builder()
            .timestamp(LocalDateTime.now())
            .status(400)
            .code("VALIDATION_ERROR")
            .message(message)
            .path(request.getRequestURI())
            .build();

        return ResponseEntity
            .badRequest()
            .body(response);
    }

    // Xử lý các lỗi không xác định, trả về 500 với thông báo chung
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleException(
        Exception ex,
        HttpServletRequest request
    ) {
        log.error(
            "Không xử lý được lỗi: method={}, uri={}",
            request.getMethod(),
            request.getRequestURI(),
            ex
        );

        ErrorResponse response = ErrorResponse.builder()
            .timestamp(LocalDateTime.now())
            .status(500)
            .code("INTERNAL_SERVER_ERROR")
            .message("Đã xảy ra lỗi hệ thống")
            .path(request.getRequestURI())
            .build();

        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(response);
    }

//KIỂM TRA LỖI KHI THAM SỐ TRUYỀN VÀO KHÔNG ĐÚNG ĐỊNH DẠNG, TRẢ VỀ 400 VỚI THÔNG BÁO RÕ RÀNG
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatchException(
        MethodArgumentTypeMismatchException ex,
        HttpServletRequest request
    ) {
        String message = String.format("Tham số '%s' không đúng định dạng", ex.getName());

        ErrorResponse response = ErrorResponse.builder()
            .timestamp(LocalDateTime.now())
            .status(400)
            .code("INVALID_PARAMETER")
            .message(message)
            .path(request.getRequestURI())
            .build();

        return ResponseEntity
            .badRequest()
            .body(response);
    }


//    KIỂM TRA LỖI JSON KHÔNG HỢP LỆ, TRẢ VỀ 400 VỚI THÔNG BÁO RÕ RÀNG
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleHttpMessageNotReadableException(
        HttpMessageNotReadableException ex,
        HttpServletRequest request
    ) {
        ErrorResponse response = ErrorResponse.builder()
            .timestamp(LocalDateTime.now())
            .status(400)
            .code("INVALID_JSON")
            .message("Dữ liệu JSON không đúng định dạng cú pháp")
            .path(request.getRequestURI())
            .build();

        return ResponseEntity
            .badRequest()
            .body(response);
    }
}
