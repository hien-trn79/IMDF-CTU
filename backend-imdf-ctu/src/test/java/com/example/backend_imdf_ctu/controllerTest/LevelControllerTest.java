package com.example.backend_imdf_ctu.controllerTest;

import com.example.backend_imdf_ctu.controller.LevelController;
import com.example.backend_imdf_ctu.dto.request.LevelRequest;
import com.example.backend_imdf_ctu.exception.BusinessException;
import com.example.backend_imdf_ctu.exception.ErrorCode;
import com.example.backend_imdf_ctu.repository.UserRepository;
import com.example.backend_imdf_ctu.service.interfaces.JwtService;
import com.example.backend_imdf_ctu.service.interfaces.LevelService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
    controllers = LevelController.class,
    properties = "spring.data.web.pageable.max-page-size=100")
@AutoConfigureMockMvc(addFilters = false)
class LevelControllerTest {

    @Autowired
    private MockMvc mockMvc;

    // Bean mà bộ lọc JWT và SecurityConfig cần khi @WebMvcTest nạp ngữ cảnh
    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserRepository userRepository;

    @MockitoBean
    private LevelService service;

    // Bổ sung các trường bắt buộc khác của LevelRequest vào chuỗi JSON này
    private static final String VALID_BODY = """
            {"levelCategoryId": 1}
            """;

    // ---------- GET /levels ----------

    @Test
    @DisplayName("GET /levels trả 200 và danh sách trong content")
    void list_returnsPage() throws Exception {
        LevelResponse r = new LevelResponse();
        r.setId(1);   // giả định LevelResponse có setId(Integer)
        given(service.list(any(Pageable.class)))
            .willReturn(new PageImpl<>(List.of(r), PageRequest.of(0, 20), 1));

        mockMvc.perform(get("/levels"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].id").value(1));
    }

    @Test
    @DisplayName("page, size, sort được chuyển đúng xuống service")
    void list_passesPagingAndSort() throws Exception {
        given(service.list(any(Pageable.class))).willReturn(Page.empty());

        mockMvc.perform(get("/levels")
                .param("page", "2").param("size", "5").param("sort", "ordinal,desc"))
            .andExpect(status().isOk());

        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(service).list(captor.capture());
        Pageable p = captor.getValue();
        assertThat(p.getPageNumber()).isEqualTo(2);
        assertThat(p.getPageSize()).isEqualTo(5);
        assertThat(p.getSort().getOrderFor("ordinal").getDirection()).isEqualTo(Sort.Direction.DESC);
    }

    @Test
    @DisplayName("Không gửi tham số: trang 0, kích thước 20")
    void list_usesDefaults() throws Exception {
        given(service.list(any(Pageable.class))).willReturn(Page.empty());

        mockMvc.perform(get("/levels")).andExpect(status().isOk());

        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(service).list(captor.capture());
        assertThat(captor.getValue().getPageNumber()).isZero();
        assertThat(captor.getValue().getPageSize()).isEqualTo(20);
    }

    @Test
    @DisplayName("size quá lớn bị chặn ở mức tối đa 100")
    void list_capsPageSize() throws Exception {
        given(service.list(any(Pageable.class))).willReturn(Page.empty());

        mockMvc.perform(get("/levels").param("size", "100000")).andExpect(status().isOk());

        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(service).list(captor.capture());
        assertThat(captor.getValue().getPageSize()).isEqualTo(100);
    }

    // ---------- GET /levels/{id} ----------

    @Test
    @DisplayName("GET /levels/{id} trả 200 khi tồn tại")
    void getById_ok() throws Exception {
        LevelResponse r = new LevelResponse();
        r.setId(7);
        given(service.getById(7)).willReturn(r);

        mockMvc.perform(get("/levels/7"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(7));
    }

    @Test
    @DisplayName("GET /levels/{id} không tồn tại trả 404")
    void getById_notFound() throws Exception {
        given(service.getById(99)).willThrow(new BusinessException(ErrorCode.LEVEL_NOT_FOUND));

        mockMvc.perform(get("/levels/99")).andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("id không phải số trả 400, không gọi service")
    void getById_nonNumericId() throws Exception {
        mockMvc.perform(get("/levels/abc"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value(400));
        verifyNoInteractions(service);
    }

    // ---------- POST /levels ----------

    @Test
    @DisplayName("POST hợp lệ trả 201 và chuyển đúng dữ liệu xuống service")
    void create_ok() throws Exception {
        given(service.create(any(LevelRequest.class))).willReturn(new LevelResponse());

        mockMvc.perform(post("/levels").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
            .andExpect(status().isCreated());

        ArgumentCaptor<LevelRequest> captor = ArgumentCaptor.forClass(LevelRequest.class);
        verify(service).create(captor.capture());
        assertThat(captor.getValue().getLevelCategoryId()).isEqualTo(1);
    }

    @Test
    @DisplayName("JSON sai cú pháp trả 400, không gọi service")
    void create_malformedJson() throws Exception {
        mockMvc.perform(post("/levels")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{ không phải json"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value(400));
        verifyNoInteractions(service);
    }

    @Test
    @DisplayName("POST thiếu levelCategoryId trả 400, không gọi service")
    void create_missingCategory() throws Exception {
        mockMvc.perform(post("/levels")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value(400));
        verifyNoInteractions(service);
    }

    @Test
    @DisplayName("Category không tồn tại: lỗi nghiệp vụ được ánh xạ thành 404")
    void create_categoryNotFound() throws Exception {
        given(service.create(any(LevelRequest.class)))
            .willThrow(new BusinessException(ErrorCode.LEVEL_CATEGORY_NOT_FOUND));

        mockMvc.perform(post("/levels").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
            .andExpect(status().isNotFound());
    }

    // ---------- PUT /levels/{id} ----------

    @Test
    @DisplayName("PUT trả 200 và gọi update đúng id")
    void update_ok() throws Exception {
        given(service.update(eq(5), any(LevelRequest.class))).willReturn(new LevelResponse());

        mockMvc.perform(put("/levels/5").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
            .andExpect(status().isOk());

        verify(service).update(eq(5), any(LevelRequest.class));
    }

    @Test
    @DisplayName("PUT thiếu levelCategoryId trả 400, không gọi service")
    void update_missingCategory() throws Exception {
        mockMvc.perform(put("/levels/5")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value(400));
        verifyNoInteractions(service);
    }

    @Test
    @DisplayName("PUT level không tồn tại trả 404")
    void update_notFound() throws Exception {
        given(service.update(eq(99), any(LevelRequest.class)))
            .willThrow(new BusinessException(ErrorCode.LEVEL_NOT_FOUND));

        mockMvc.perform(put("/levels/99").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
            .andExpect(status().isNotFound());
    }

    // ---------- DELETE /levels/{id} ----------

    @Test
    @DisplayName("DELETE trả 204 và gọi delete đúng id")
    void delete_ok() throws Exception {
        mockMvc.perform(delete("/levels/5")).andExpect(status().isNoContent());
        verify(service).delete(5);
    }

    @Test
    @DisplayName("DELETE level không tồn tại trả 404")
    void delete_notFound() throws Exception {
        doThrow(new BusinessException(ErrorCode.LEVEL_NOT_FOUND)).when(service).delete(99);

        mockMvc.perform(delete("/levels/99")).andExpect(status().isNotFound());
    }
}