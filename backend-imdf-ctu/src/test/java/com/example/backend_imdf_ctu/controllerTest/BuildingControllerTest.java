package com.example.backend_imdf_ctu.controllerTest;

import com.example.backend_imdf_ctu.controller.BuildingController;
import com.example.backend_imdf_ctu.dto.request.BuildingRequest;
import com.example.backend_imdf_ctu.dto.response.BuildingResponse;
import com.example.backend_imdf_ctu.exception.BusinessException;
import com.example.backend_imdf_ctu.exception.ErrorCode;
import com.example.backend_imdf_ctu.repository.UserRepository;
import com.example.backend_imdf_ctu.service.interfaces.BuildingService;
import com.example.backend_imdf_ctu.service.interfaces.JwtService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
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
    controllers = BuildingController.class,
    properties = "spring.data.web.pageable.max-page-size=100")
@AutoConfigureMockMvc(addFilters = false)
class BuildingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    // Bean mà bộ lọc JWT và SecurityConfig cần khi @WebMvcTest nạp ngữ cảnh
    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserRepository userRepository;

    @MockitoBean
    private BuildingService service;

    // Tên trường lấy từ các getter service đang dùng; điều chỉnh nếu BuildingRequest khác
    private static final String VALID_BODY = """
            {"featureId": 1, "addressId": 1, "restrictionCategoryId": 1, "buildingCategoryId": 1}
            """;

    private static final String BODY_WITHOUT_CATEGORY = """
            {"featureId": 1, "addressId": 1, "restrictionCategoryId": 1}
            """;

    // ---------- GET /buildings ----------

    @Test
    @DisplayName("GET /buildings trả 200 và danh sách trong content")
    void list_returnsPage() throws Exception {
        BuildingResponse r = new BuildingResponse();
        r.setId(1);   // giả định BuildingResponse có setId(Integer)
        given(service.list(any(Pageable.class)))
            .willReturn(new PageImpl<>(List.of(r), PageRequest.of(0, 20), 1));

        mockMvc.perform(get("/buildings"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].id").value(1));
    }

    @Test
    @DisplayName("page, size, sort được chuyển đúng xuống service (không truyền null)")
    void list_passesPagingAndSort() throws Exception {
        given(service.list(any(Pageable.class))).willReturn(Page.empty());

        mockMvc.perform(get("/buildings")
                .param("page", "2").param("size", "5").param("sort", "id,desc"))
            .andExpect(status().isOk());

        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(service).list(captor.capture());
        Pageable p = captor.getValue();
        assertThat(p).isNotNull();
        assertThat(p.getPageNumber()).isEqualTo(2);
        assertThat(p.getPageSize()).isEqualTo(5);
        assertThat(p.getSort().getOrderFor("id").getDirection()).isEqualTo(Sort.Direction.DESC);
    }

    @Test
    @DisplayName("Không gửi tham số: trang 0, kích thước 20")
    void list_usesDefaults() throws Exception {
        given(service.list(any(Pageable.class))).willReturn(Page.empty());

        mockMvc.perform(get("/buildings")).andExpect(status().isOk());

        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(service).list(captor.capture());
        assertThat(captor.getValue().getPageNumber()).isZero();
        assertThat(captor.getValue().getPageSize()).isEqualTo(20);
    }


    // ---------- GET /buildings/{id} ----------

    @Test
    @DisplayName("GET /buildings/{id} trả 200 khi tồn tại")
    void getById_ok() throws Exception {
        BuildingResponse r = new BuildingResponse();
        r.setId(7);
        given(service.getById(7)).willReturn(r);

        mockMvc.perform(get("/buildings/7"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(7));
    }

    @Test
    @DisplayName("GET /buildings/{id} không tồn tại trả 404")
    void getById_notFound() throws Exception {
        given(service.getById(99)).willThrow(new BusinessException(ErrorCode.BUILDING_NOT_FOUND));

        mockMvc.perform(get("/buildings/99")).andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("id không phải số trả 400, không gọi service")
    void getById_nonNumericId() throws Exception {
        mockMvc.perform(get("/buildings/abc"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value(400));
        verifyNoInteractions(service);
    }

    // ---------- POST /buildings ----------

    @Test
    @DisplayName("POST hợp lệ trả 201 và chuyển đúng dữ liệu xuống service")
    void create_ok() throws Exception {
        given(service.create(any(BuildingRequest.class))).willReturn(new BuildingResponse());

        mockMvc.perform(post("/buildings").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
            .andExpect(status().isCreated());

        ArgumentCaptor<BuildingRequest> captor = ArgumentCaptor.forClass(BuildingRequest.class);
        verify(service).create(captor.capture());
        assertThat(captor.getValue().getBuildingCategoryId()).isEqualTo(1);
        assertThat(captor.getValue().getFeatureId()).isEqualTo(1);
    }

    @Test
    @DisplayName("JSON sai cú pháp trả 400, không gọi service")
    void create_malformedJson() throws Exception {
        mockMvc.perform(post("/buildings")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{ không phải json"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value(400));
        verifyNoInteractions(service);
    }

    @Test
    @DisplayName("POST thiếu buildingCategoryId trả 400, không gọi service")
    void create_missingCategory() throws Exception {
        mockMvc.perform(post("/buildings")
                .contentType(MediaType.APPLICATION_JSON)
                .content(BODY_WITHOUT_CATEGORY))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value(400));
        verifyNoInteractions(service);
    }

    @ParameterizedTest(name = "POST: {0} được ánh xạ thành 404")
    @EnumSource(value = ErrorCode.class, names = {
        "FEATURE_NOT_FOUND", "ADDRESS_NOT_FOUND",
        "RESTRICTION_CATEGORY_NOT_FOUND", "BUILDING_CATEGORY_NOT_FOUND"})
    @DisplayName("POST: thực thể liên quan không tồn tại trả 404")
    void create_relatedEntityNotFound(ErrorCode code) throws Exception {
        given(service.create(any(BuildingRequest.class))).willThrow(new BusinessException(code));

        mockMvc.perform(post("/buildings").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
            .andExpect(status().isNotFound());
    }

    // ---------- PUT /buildings/{id} ----------

    @Test
    @DisplayName("PUT trả 200 và gọi update đúng id")
    void update_ok() throws Exception {
        given(service.update(eq(5), any(BuildingRequest.class))).willReturn(new BuildingResponse());

        mockMvc.perform(put("/buildings/5").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
            .andExpect(status().isOk());

        verify(service).update(eq(5), any(BuildingRequest.class));
    }

    @Test
    @DisplayName("PUT thiếu buildingCategoryId trả 400, không gọi service")
    void update_missingCategory() throws Exception {
        mockMvc.perform(put("/buildings/5")
                .contentType(MediaType.APPLICATION_JSON)
                .content(BODY_WITHOUT_CATEGORY))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value(400));
        verifyNoInteractions(service);
    }

    @Test
    @DisplayName("PUT building không tồn tại trả 404")
    void update_notFound() throws Exception {
        given(service.update(eq(99), any(BuildingRequest.class)))
            .willThrow(new BusinessException(ErrorCode.BUILDING_NOT_FOUND));

        mockMvc.perform(put("/buildings/99").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
            .andExpect(status().isNotFound());
    }

    @ParameterizedTest(name = "PUT: {0} được ánh xạ thành 404")
    @EnumSource(value = ErrorCode.class, names = {
        "FEATURE_NOT_FOUND", "ADDRESS_NOT_FOUND",
        "RESTRICTION_CATEGORY_NOT_FOUND", "BUILDING_CATEGORY_NOT_FOUND"})
    @DisplayName("PUT: thực thể liên quan không tồn tại trả 404")
    void update_relatedEntityNotFound(ErrorCode code) throws Exception {
        given(service.update(eq(5), any(BuildingRequest.class))).willThrow(new BusinessException(code));

        mockMvc.perform(put("/buildings/5").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
            .andExpect(status().isNotFound());
    }

    // ---------- DELETE /buildings/{id} ----------

    @Test
    @DisplayName("DELETE trả 204 và gọi delete đúng id")
    void delete_ok() throws Exception {
        mockMvc.perform(delete("/buildings/5")).andExpect(status().isNoContent());
        verify(service).delete(5);
    }

    @Test
    @DisplayName("DELETE building không tồn tại trả 404")
    void delete_notFound() throws Exception {
        doThrow(new BusinessException(ErrorCode.BUILDING_NOT_FOUND)).when(service).delete(99);

        mockMvc.perform(delete("/buildings/99")).andExpect(status().isNotFound());
    }
}