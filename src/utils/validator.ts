export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export const validateImage = (file: { size: number; type?: string; path?: string }): ValidationResult => {
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
  const MAX_SIZE = 5 * 1024 * 1024;

  if (file.type && !ALLOWED_TYPES.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: '仅支持 JPEG/PNG 格式的图片'
    };
  }

  if (file.path) {
    const ext = file.path.split('.').pop()?.toLowerCase();
    if (ext && !['jpg', 'jpeg', 'png'].includes(ext)) {
      return {
        valid: false,
        error: '仅支持 JPEG/PNG 格式的图片'
      };
    }
  }

  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      error: '图片大小不能超过 5MB'
    };
  }

  return { valid: true };
};

export const validateContent = (content: string): ValidationResult => {
  if (!content.trim()) {
    return { valid: false, error: '内容不能为空' };
  }
  if (content.length > 5000) {
    return { valid: false, error: '内容不能超过 5000 字' };
  }
  return { valid: true };
};
