package com.example.backend_imdf_ctu.controllerTest;

import com.example.backend_imdf_ctu.controller.UnitController;
import com.example.backend_imdf_ctu.dto.request.UnitRequest;
import com.example.backend_imdf_ctu.exception.BusinessException;
import com.example.backend_imdf_ctu.exception.ErrorCode;
import com.example.backend_imdf_ctu.repository.UserRepository;
import com.example.backend_imdf_ctu.service.interfaces.JwtService;
import com.example.backend_imdf_ctu.service.interfaces.UnitService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.MethodSource;
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
import java.util.stream.Stream;

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
    controllers = UnitController.class,
    properties = "spring.data.web.pageable.max-page-size=100")
@AutoConfigureMockMvc(addFilters = false)
class UnitControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserRepository userRepository;

    @MockitoBean
    private UnitService service;

    private static final String GEOMETRY = """
            "geometry": {"type": "Polygon", "coordinates":
              [[[105.0, 10.0], [105.001, 10.0], [105.001, 10.001], [105.0, 10.001], [105.0, 10.0]]]}
            """;

    private static final String DISPLAY_POINT = """
            "displayPoint": {"type": "Point", "coordinates": [105.0005, 10.0005]}
            """;

    private static final String VALID_BODY = "{"
        + "\"featureId\": 1, \"levelId\": 1, \"unitCategoryId\": 1, \"restrictionCategoryId\": 1,"
        + GEOMETRY + "," + DISPLAY_POINT + "}";

    /** Mỗi body thiếu đúng một trường bắt buộc (điều chỉnh theo ràng buộc thật của UnitRequest). */
    static Stream<String> bodiesMissingRequiredField() {
        return Stream.of(
            "{\"featureId\": 1, \"unitCategoryId\": 1, \"restrictionCategoryId\": 1,"
                + GEOMETRY + "," + DISPLAY_POINT + "}",                       // thiếu levelId
            "{\"featureId\": 1, \"levelId\": 1, \"restrictionCategoryId\": 1,"
                + GEOMETRY + "," + DISPLAY_POINT + "}",                       // thiếu unitCategoryId
            "{\"featureId\": 1, \"levelId\": 1, \"unitCategoryId\": 1, \"restrictionCategoryId\": 1,"
                + DISPLAY_POINT + "}",                                          // thiếu geometry
            "{}");
    }

    // ---------- GET /units ----------

    @Test
    @DisplayName("GET /units trả 200 và danh sách trong content")
    void list_returnsPage() throws Exception {
        UnitResponse r = new UnitResponse();
        r.setId(1);   // giả định UnitResponse có setId(Integer)
        given(service.getAll(any(Pageable.class)))
            .willReturn(new PageImpl<>(List.of(r), PageRequest.of(0, 20), 1));

        mockMvc.perform(get("/units"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].id").value(1));
    }

    @Test
    @DisplayName("page, size, sort được chuyển đúng xuống service")
    void list_passesPagingAndSort() throws Exception {
        given(service.getAll(any(Pageable.class))).willReturn(Page.empty());

        mockMvc.perform(get("/units").param("page", "2").param("size", "5").param("sort", "id,desc"))
            .andExpect(status().isOk());

        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(service).getAll(captor.capture());
        assertThat(captor.getValue().getPageNumber()).isEqualTo(2);
        assertThat(captor.getValue().getPageSize()).isEqualTo(5);
        assertThat(captor.getValue().getSort().getOrderFor("id").getDirection())
            .isEqualTo(Sort.Direction.DESC);
    }

    @Test
    @DisplayName("Không gửi tham số: trang 0, kích thước 20")
    void list_usesDefaults() throws Exception {
        given(service.getAll(any(Pageable.class))).willReturn(Page.empty());

        mockMvc.perform(get("/units")).andExpect(status().isOk());

        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(service).getAll(captor.capture());
        assertThat(captor.getValue().getPageNumber()).isZero();
        assertThat(captor.getValue().getPageSize()).isEqualTo(20);
    }

    @Test
    @DisplayName("size quá lớn bị chặn ở mức tối đa 100")
    void list_capsPageSize() throws Exception {
        given(service.getAll(any(Pageable.class))).willReturn(Page.empty());

        mockMvc.perform(get("/units").param("size", "100000")).andExpect(status().isOk());

        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(service).getAll(captor.capture());
        assertThat(captor.getValue().getPageSize()).isEqualTo(100);
    }

    // ---------- GET /units/{id} ----------

    @Test
    @DisplayName("GET /units/{id} trả 200 khi tồn tại")
    void getById_ok() throws Exception {
        UnitResponse r = new UnitResponse();
        r.setId(7);
        given(service.getById(7)).willReturn(r);

        mockMvc.perform(get("/units/7"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(7));
    }

    @Test
    @DisplayName("GET /units/{id} không tồn tại trả 404")
    void getById_notFound() throws Exception {
        given(service.getById(99)).willThrow(new BusinessException(ErrorCode.UNIT_NOT_FOUND));

        mockMvc.perform(get("/units/99")).andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("id không phải số trả 400, không gọi service")
    void getById_nonNumericId() throws Exception {
        mockMvc.perform(get("/units/abc"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value(400));
        verifyNoInteractions(service);
    }

    // ---------- POST /units ----------

    @Test
    @DisplayName("POST hợp lệ trả 201 và chuyển đúng dữ liệu xuống service")
    void create_ok() throws Exception {
        given(service.create(any(UnitRequest.class))).willReturn(new UnitResponse());

        mockMvc.perform(post("/units").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
            .andExpect(status().isCreated());

        ArgumentCaptor<UnitRequest> captor = ArgumentCaptor.forClass(UnitRequest.class);
        verify(service).create(captor.capture());
        assertThat(captor.getValue().getLevelId()).isEqualTo(1);
        assertThat(captor.getValue().getUnitCategoryId()).isEqualTo(1);
        assertThat(captor.getValue().getGeometry()).isNotNull();
    }

    @Test
    @DisplayName("JSON sai cú pháp trả 400, không gọi service")
    void create_malformedJson() throws Exception {
        mockMvc.perform(post("/units").contentType(MediaType.APPLICATION_JSON).content("{ không phải json"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value(400));
        verifyNoInteractions(service);
    }

    @ParameterizedTest(name = "POST thiếu trường bắt buộc #{index} trả 400")
    @MethodSource("bodiesMissingRequiredField")
    @DisplayName("POST thiếu trường bắt buộc trả 400, không gọi service")
    void create_missingRequiredField(String body) throws Exception {
        mockMvc.perform(post("/units").contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value(400));
        verifyNoInteractions(service);
    }

    @ParameterizedTest(name = "POST: {0} được ánh xạ thành 404")
    @EnumSource(value = ErrorCode.class, names = {
        "FEATURE_NOT_FOUND", "LEVEL_NOT_FOUND",
        "RESTRICTION_CATEGORY_NOT_FOUND", "UNIT_CATEGORY_NOT_FOUND"})
    @DisplayName("POST: thực thể liên quan không tồn tại trả 404")
    void create_relatedEntityNotFound(ErrorCode code) throws Exception {
        given(service.create(any(UnitRequest.class))).willThrow(new BusinessException(code));

        mockMvc.perform(post("/units").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
            .andExpect(status().isNotFound());
    }

    // ---------- PUT /units/{id} ----------

    @Test
    @DisplayName("PUT trả 200 và gọi update đúng id")
    void update_ok() throws Exception {
        given(service.update(eq(5), any(UnitRequest.class))).willReturn(new UnitResponse());

        mockMvc.perform(put("/units/5").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
            .andExpect(status().isOk());

        verify(service).update(eq(5), any(UnitRequest.class));
    }

    @ParameterizedTest(name = "PUT thiếu trường bắt buộc #{index} trả 400")
    @MethodSource("bodiesMissingRequiredField")
    @DisplayName("PUT thiếu trường bắt buộc trả 400, không gọi service")
    void update_missingRequiredField(String body) throws Exception {
        mockMvc.perform(put("/units/5").contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value(400));
        verifyNoInteractions(service);
    }

    @Test
    @DisplayName("PUT unit không tồn tại trả 404")
    void update_notFound() throws Exception {
        given(service.update(eq(99), any(UnitRequest.class)))
            .willThrow(new BusinessException(ErrorCode.UNIT_NOT_FOUND));

        mockMvc.perform(put("/units/99").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
            .andExpect(status().isNotFound());
    }

    // ---------- DELETE /units/{id} ----------

    @Test
    @DisplayName("DELETE trả 204 và gọi delete đúng id")
    void delete_ok() throws Exception {
        mockMvc.perform(delete("/units/5")).andExpect(status().isNoContent());
        verify(service).delete(5);
    }

    @Test
    @DisplayName("DELETE unit không tồn tại trả 404")
    void delete_notFound() throws Exception {
        doThrow(new BusinessException(ErrorCode.UNIT_NOT_FOUND)).when(service).delete(99);

        mockMvc.perform(delete("/units/99")).andExpect(status().isNotFound());
    }
}