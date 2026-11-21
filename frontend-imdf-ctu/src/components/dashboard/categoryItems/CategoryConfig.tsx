import type { ReactNode } from 'react'
import {
  Building2,
  ChartBarBig,
  Circle,
  DoorClosedIcon,
  LandPlot,
  Star,
  UserLock,
} from 'lucide-react'
import type { useDashboard } from '../../../context/DashboardContext'

/** Bản ghi danh mục dạng tổng quát: luôn có id, các trường còn lại tùy danh mục */
export type CategoryRecord = { id: number } & Record<string, unknown>

type DashboardCtx = ReturnType<typeof useDashboard>

export interface CategoryField {
  key: string
  label: string
  required?: boolean
  placeholder?: string
}

export interface CategoryConfig {
  id: string
  /** Nhãn hiển thị trên tab */
  name: string
  /** Tiêu đề trong phần nội dung của tab */
  title: string
  description: string
  /** Tên dùng trong câu: "Thêm {noun}", "Xóa {noun}" */
  noun: string
  icon: ReactNode
  /** Đường dẫn API (không gồm /api). Dùng cho POST /x, PUT /x/{id}, DELETE /x/{id} */
  endpoint: string
  /** true: chỉ xem, không thêm / sửa / xóa */
  readOnly?: boolean
  /** Trường mặc định, dùng khi bảng chưa có bản ghi nào. Khi đã có dữ liệu thì suy ra từ dữ liệu thật. */
  fields: CategoryField[]
  getData: (ctx: DashboardCtx) => CategoryRecord[] | null
}

const asRecords = (data: unknown) => data as CategoryRecord[] | null

export const CATEGORY_TABS: CategoryConfig[] = [
  {
    id: 'venue',
    name: 'Địa điểm',
    title: 'VenueCategory',
    description: 'Các loại địa điểm trong hệ thống bản đồ',
    noun: 'danh mục địa điểm',
    icon: <LandPlot size={16} />,
    endpoint: '/venue-categories',
    fields: [
      {
        key: 'venueCategoryName',
        label: 'Tên tiếng Anh',
        required: true,
        placeholder: 'VD: university',
      },
      {
        key: 'venueCategoryVietnameseName',
        label: 'Tên tiếng Việt',
        placeholder: 'VD: Trường đại học',
      },
    ],
    getData: (c) => asRecords(c.venueCateData),
  },
  {
    id: 'building',
    name: 'Tòa nhà',
    title: 'BuildingCategory',
    description: 'Các loại tòa nhà trong khuôn viên',
    noun: 'danh mục tòa nhà',
    icon: <Building2 size={16} />,
    endpoint: '/building-categories',
    fields: [
      {
        key: 'buildingCategoryName',
        label: 'Tên tiếng Anh',
        required: true,
        placeholder: 'VD: school',
      },
      {
        key: 'buildingCategoryVietnameseName',
        label: 'Tên tiếng Việt',
        placeholder: 'VD: Trường học',
      },
    ],
    getData: (c) => asRecords(c.buildingCateData),
  },
  {
    id: 'unit',
    name: 'Phòng học',
    title: 'UnitCategory',
    description: 'Các loại phòng, không gian bên trong tòa nhà',
    noun: 'danh mục phòng học',
    icon: <DoorClosedIcon size={16} />,
    endpoint: '/unit-categories',
    fields: [
      {
        key: 'unitCategoryName',
        label: 'Tên tiếng Anh',
        required: true,
        placeholder: 'VD: classroom',
      },
      { key: 'unitCategoryVietnameseName', label: 'Tên tiếng Việt', placeholder: 'VD: Phòng học' },
    ],
    getData: (c) => asRecords(c.unitCateData),
  },
  {
    id: 'level',
    name: 'Tầng',
    title: 'LevelCategory',
    description: 'Các loại tầng trong tòa nhà',
    noun: 'danh mục tầng',
    icon: <Circle size={16} />,
    endpoint: '/level-categories',
    fields: [
      {
        key: 'levelCategoryName',
        label: 'Tên tiếng Anh',
        required: true,
        placeholder: 'VD: ground',
      },
      { key: 'levelCategoryVietnameseName', label: 'Tên tiếng Việt', placeholder: 'VD: Tầng trệt' },
    ],
    getData: (c) => asRecords(c.levelCateData),
  },
  {
    id: 'feature',
    name: 'Feature',
    title: 'Feature',
    description: 'Danh sách feature trong hệ thống (chỉ xem, được tạo tự động khi thêm đối tượng)',
    noun: 'feature',
    icon: <ChartBarBig size={16} />,
    endpoint: '/features',
    readOnly: true,
    fields: [
      { key: 'featureId', label: 'Feature UUID' },
      { key: 'featureType', label: 'Loại feature' },
    ],
    getData: (c) => asRecords(c.featureData),
  },
  {
    id: 'amenity',
    name: 'Tiện ích',
    title: 'AmenityCategory',
    description: 'Các loại tiện ích trong khuôn viên',
    noun: 'danh mục tiện ích',
    icon: <Star size={16} />,
    endpoint: '/amenity-categories',
    fields: [
      {
        key: 'amenityCategoryName',
        label: 'Tên tiếng Anh',
        required: true,
        placeholder: 'VD: restroom',
      },
      {
        key: 'amenityCategoryVietnameseName',
        label: 'Tên tiếng Việt',
        placeholder: 'VD: Nhà vệ sinh',
      },
    ],
    getData: (c) => asRecords(c.amenityCateData),
  },
  {
    id: 'restriction',
    name: 'Hạn chế',
    title: 'Danh mục hạn chế - RestrictionCategory',
    description: 'Các mức hạn chế truy cập',
    noun: 'danh mục hạn chế',
    icon: <UserLock size={16} />,
    endpoint: '/restriction-categories',
    fields: [
      {
        key: 'restrictionCateName',
        label: 'Tên hạn chế',
        required: true,
        placeholder: 'VD: restricted',
      },
    ],
    getData: (c) => asRecords(c.restrictionCateData),
  },
]

export const DEFAULT_TAB = CATEGORY_TABS[0].id

const humanize = (key: string) => {
  const spaced = key.replace(/([A-Z])/g, ' $1').trim()
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

/**
 * Xác định các trường nhập liệu của danh mục.
 * Có dữ liệu thật thì lấy theo tên trường trong bản ghi đầu tiên (chỉ các trường chuỗi),
 * nhờ vậy không phụ thuộc vào việc đặt tên trường trong cấu hình ở trên.
 */
export function resolveFields(
  config: CategoryConfig,
  data: CategoryRecord[] | null
): CategoryField[] {
  const sample = data?.[0]
  if (!sample) return config.fields

  const known = new Map(config.fields.map((f) => [f.key, f]))
  const keys = Object.keys(sample).filter(
    (k) => k !== 'id' && (typeof sample[k] === 'string' || sample[k] === null)
  )
  if (keys.length === 0) return config.fields

  return keys.map(
    (key, index) => known.get(key) ?? { key, label: humanize(key), required: index === 0 }
  )
}

/** Chuyển giá trị bất kỳ thành chuỗi để hiển thị */
export const displayValue = (v: unknown): string => {
  if (v === null || v === undefined || v === '') return '—'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}
