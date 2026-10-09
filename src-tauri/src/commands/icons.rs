use std::collections::HashMap;
use std::sync::Mutex;

type HICON = *mut std::ffi::c_void;
type HBITMAP = *mut std::ffi::c_void;
type HDC = *mut std::ffi::c_void;
type HWND = *mut std::ffi::c_void;
type HGDIOBJ = *mut std::ffi::c_void;

#[repr(C)]
struct SHFILEINFOW {
    h_icon: HICON,
    i_icon: i32,
    dw_attributes: u32,
    sz_display_name: [u16; 260],
    sz_type_name: [u16; 80],
}

#[repr(C)]
struct ICONINFO {
    f_icon: i32,
    x_hotspot: u32,
    y_hotspot: u32,
    hbm_mask: HBITMAP,
    hbm_color: HBITMAP,
}

#[repr(C)]
struct BITMAPINFOHEADER {
    bi_size: u32,
    bi_width: i32,
    bi_height: i32,
    bi_planes: u16,
    bi_bit_count: u16,
    bi_compression: u32,
    bi_size_image: u32,
    bi_x_pels_per_meter: i32,
    bi_y_pels_per_meter: i32,
    bi_clr_used: u32,
    bi_clr_important: u32,
}

#[repr(C)]
struct BITMAPINFO {
    bmi_header: BITMAPINFOHEADER,
    bmi_colors: [u32; 1],
}

#[repr(C)]
struct BITMAP {
    bm_type: i32,
    bm_width: i32,
    bm_height: i32,
    bm_width_bytes: i32,
    bm_planes: u16,
    bm_bits_pixel: u16,
    bm_bits: *mut std::ffi::c_void,
}

const SHGFI_ICON: u32 = 0x000000100;
const SHGFI_SMALLICON: u32 = 0x000000001;

#[link(name = "shell32")]
extern "system" {
    fn SHGetFileInfoW(
        psz_path: *const u16,
        dw_file_attributes: u32,
        psfi: *mut SHFILEINFOW,
        cb_file_info: u32,
        u_flags: u32,
    ) -> usize;

    fn ExtractIconExW(
        lpsz_file: *const u16,
        n_icon_index: i32,
        phicon_large: *mut HICON,
        phicon_small: *mut HICON,
        n_icons: u32,
    ) -> u32;
}

#[link(name = "user32")]
extern "system" {
    fn GetIconInfo(h_icon: HICON, piconinfo: *mut ICONINFO) -> i32;
    fn DestroyIcon(h_icon: HICON) -> i32;
    fn GetDC(h_wnd: HWND) -> HDC;
    fn ReleaseDC(h_wnd: HWND, h_dc: HDC) -> i32;
}

#[link(name = "gdi32")]
extern "system" {
    fn GetObjectW(h: HGDIOBJ, c: i32, pv: *mut std::ffi::c_void) -> i32;
    fn GetDIBits(
        hdc: HDC,
        hbm: HBITMAP,
        start: u32,
        c_lines: u32,
        lpv_bits: *mut std::ffi::c_void,
        lpbmi: *mut BITMAPINFO,
        usage: u32,
    ) -> i32;
    fn DeleteObject(ho: HGDIOBJ) -> i32;
}

#[link(name = "kernel32")]
extern "system" {
    fn ExpandEnvironmentStringsW(lp_src: *const u16, lp_dst: *mut u16, n_size: u32) -> u32;
}

static ICON_CACHE: Mutex<Option<HashMap<String, Option<String>>>> = Mutex::new(None);

pub fn expand_env_path(path: &str) -> String {
    if !path.contains('%') {
        return path.to_string();
    }
    let wide: Vec<u16> = path.encode_utf16().chain(std::iter::once(0)).collect();
    let mut buf = vec![0u16; 1024];
    let len = unsafe { ExpandEnvironmentStringsW(wide.as_ptr(), buf.as_mut_ptr(), buf.len() as u32) };
    if len > 0 && (len as usize) < buf.len() {
        String::from_utf16_lossy(&buf[..len as usize - 1])
    } else {
        path.to_string()
    }
}

pub fn parse_display_icon(raw: &str) -> Option<String> {
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return None;
    }
    let unquoted = if trimmed.starts_with('"') {
        if let Some(end) = trimmed[1..].find('"') {
            &trimmed[1..=end]
        } else {
            trimmed.trim_matches('"')
        }
    } else if let Some(idx) = trimmed.find(',') {
        &trimmed[..idx]
    } else {
        trimmed
    };
    let clean = unquoted.trim();
    if clean.is_empty() {
        None
    } else {
        Some(clean.to_string())
    }
}

pub fn extract_exe_path(cmd: &str) -> Option<String> {
    let trimmed = cmd.trim();
    if trimmed.is_empty() {
        return None;
    }
    if trimmed.starts_with('"') {
        if let Some(end) = trimmed[1..].find('"') {
            return Some(trimmed[1..=end].to_string());
        }
    }
    let lower = trimmed.to_lowercase();
    if let Some(pos) = lower.find(".exe") {
        return Some(trimmed[..pos + 4].to_string());
    }
    trimmed.split_whitespace().next().map(|s| s.to_string())
}

pub fn get_cached_icon(raw_path: &str) -> Option<String> {
    let clean_path = expand_env_path(raw_path.trim());
    if clean_path.is_empty() {
        return None;
    }

    {
        let mut lock = ICON_CACHE.lock().unwrap();
        let cache = lock.get_or_insert_with(HashMap::new);
        if let Some(cached) = cache.get(&clean_path) {
            return cached.clone();
        }
    }

    let icon = extract_icon_as_png_data_url(&clean_path);

    {
        let mut lock = ICON_CACHE.lock().unwrap();
        let cache = lock.get_or_insert_with(HashMap::new);
        cache.insert(clean_path, icon.clone());
    }

    icon
}

fn extract_icon_as_png_data_url(path: &str) -> Option<String> {
    let wide_path: Vec<u16> = path.encode_utf16().chain(std::iter::once(0)).collect();

    // 1. Try SHGetFileInfoW
    let mut psfi: SHFILEINFOW = unsafe { std::mem::zeroed() };
    let res = unsafe {
        SHGetFileInfoW(
            wide_path.as_ptr(),
            0,
            &mut psfi,
            std::mem::size_of::<SHFILEINFOW>() as u32,
            SHGFI_ICON | SHGFI_SMALLICON,
        )
    };

    let h_icon = if res != 0 && !psfi.h_icon.is_null() {
        psfi.h_icon
    } else {
        // 2. Try ExtractIconExW fallback
        let mut small_icon: HICON = std::ptr::null_mut();
        let count = unsafe { ExtractIconExW(wide_path.as_ptr(), 0, std::ptr::null_mut(), &mut small_icon, 1) };
        if count > 0 && !small_icon.is_null() {
            small_icon
        } else {
            std::ptr::null_mut()
        }
    };

    if h_icon.is_null() {
        return None;
    }

    let result = hicon_to_png_data_url(h_icon);
    unsafe {
        DestroyIcon(h_icon);
    }
    result
}

fn hicon_to_png_data_url(h_icon: HICON) -> Option<String> {
    let mut icon_info: ICONINFO = unsafe { std::mem::zeroed() };
    if unsafe { GetIconInfo(h_icon, &mut icon_info) } == 0 {
        return None;
    }

    let hbm_color = icon_info.hbm_color;
    let hbm_mask = icon_info.hbm_mask;

    let hdc = unsafe { GetDC(std::ptr::null_mut()) };
    if hdc.is_null() {
        unsafe {
            if !hbm_color.is_null() {
                DeleteObject(hbm_color);
            }
            if !hbm_mask.is_null() {
                DeleteObject(hbm_mask);
            }
        }
        return None;
    }

    let mut bm: BITMAP = unsafe { std::mem::zeroed() };
    let target_bmp = if !hbm_color.is_null() { hbm_color } else { hbm_mask };
    if unsafe { GetObjectW(target_bmp, std::mem::size_of::<BITMAP>() as i32, &mut bm as *mut _ as *mut _) } == 0 {
        unsafe {
            ReleaseDC(std::ptr::null_mut(), hdc);
            if !hbm_color.is_null() {
                DeleteObject(hbm_color);
            }
            if !hbm_mask.is_null() {
                DeleteObject(hbm_mask);
            }
        }
        return None;
    }

    let width = bm.bm_width;
    // If only mask exists, height is doubled (upper half is mask, lower half is XOR color)
    let height = if hbm_color.is_null() { bm.bm_height / 2 } else { bm.bm_height };
    if width <= 0 || height <= 0 {
        unsafe {
            ReleaseDC(std::ptr::null_mut(), hdc);
            if !hbm_color.is_null() {
                DeleteObject(hbm_color);
            }
            if !hbm_mask.is_null() {
                DeleteObject(hbm_mask);
            }
        }
        return None;
    }

    let mut bmi: BITMAPINFO = unsafe { std::mem::zeroed() };
    bmi.bmi_header.bi_size = std::mem::size_of::<BITMAPINFOHEADER>() as u32;
    bmi.bmi_header.bi_width = width;
    bmi.bmi_header.bi_height = -height; // Top-down
    bmi.bmi_header.bi_planes = 1;
    bmi.bmi_header.bi_bit_count = 32;
    bmi.bmi_header.bi_compression = 0; // BI_RGB

    let num_pixels = (width * height) as usize;
    let mut bgra_pixels = vec![0u8; num_pixels * 4];

    let lines_read = unsafe {
        GetDIBits(
            hdc,
            target_bmp,
            0,
            height as u32,
            bgra_pixels.as_mut_ptr() as *mut _,
            &mut bmi,
            0,
        )
    };

    if lines_read == 0 {
        unsafe {
            ReleaseDC(std::ptr::null_mut(), hdc);
            if !hbm_color.is_null() {
                DeleteObject(hbm_color);
            }
            if !hbm_mask.is_null() {
                DeleteObject(hbm_mask);
            }
        }
        return None;
    }

    // Check if alpha channel has non-zero values
    let has_alpha = bgra_pixels.chunks_exact(4).any(|p| p[3] > 0);

    // If no alpha present in color bitmap, read the mask bitmap to synthesize alpha
    if !has_alpha && !hbm_mask.is_null() && !hbm_color.is_null() {
        let mut mask_pixels = vec![0u8; num_pixels * 4];
        let mut mask_bmi: BITMAPINFO = unsafe { std::mem::zeroed() };
        mask_bmi.bmi_header.bi_size = std::mem::size_of::<BITMAPINFOHEADER>() as u32;
        mask_bmi.bmi_header.bi_width = width;
        mask_bmi.bmi_header.bi_height = -height;
        mask_bmi.bmi_header.bi_planes = 1;
        mask_bmi.bmi_header.bi_bit_count = 32;
        mask_bmi.bmi_header.bi_compression = 0;

        let mask_read = unsafe {
            GetDIBits(
                hdc,
                hbm_mask,
                0,
                height as u32,
                mask_pixels.as_mut_ptr() as *mut _,
                &mut mask_bmi,
                0,
            )
        };

        if mask_read > 0 {
            for (color_px, mask_px) in bgra_pixels.chunks_exact_mut(4).zip(mask_pixels.chunks_exact(4)) {
                // If mask pixel is black (0), it is opaque. If white, transparent.
                color_px[3] = if mask_px[0] == 0 && mask_px[1] == 0 && mask_px[2] == 0 {
                    255
                } else {
                    0
                };
            }
        } else {
            // Default to full opacity
            for px in bgra_pixels.chunks_exact_mut(4) {
                px[3] = 255;
            }
        }
    } else if !has_alpha {
        for px in bgra_pixels.chunks_exact_mut(4) {
            px[3] = 255;
        }
    }

    // Convert BGRA to RGBA
    let mut rgba_pixels = vec![0u8; num_pixels * 4];
    for (bgra, rgba) in bgra_pixels.chunks_exact(4).zip(rgba_pixels.chunks_exact_mut(4)) {
        rgba[0] = bgra[2]; // R
        rgba[1] = bgra[1]; // G
        rgba[2] = bgra[0]; // B
        rgba[3] = bgra[3]; // A
    }

    unsafe {
        ReleaseDC(std::ptr::null_mut(), hdc);
        if !hbm_color.is_null() {
            DeleteObject(hbm_color);
        }
        if !hbm_mask.is_null() {
            DeleteObject(hbm_mask);
        }
    }

    let png_bytes = rgba_to_png(width as u32, height as u32, &rgba_pixels);
    let b64 = base64_encode(&png_bytes);
    Some(format!("data:image/png;base64,{}", b64))
}

fn rgba_to_png(width: u32, height: u32, rgba: &[u8]) -> Vec<u8> {
    let mut out = Vec::new();
    // PNG signature
    out.extend_from_slice(&[137, 80, 78, 71, 13, 10, 26, 10]);

    // IHDR
    let mut ihdr = Vec::with_capacity(13);
    ihdr.extend_from_slice(&width.to_be_bytes());
    ihdr.extend_from_slice(&height.to_be_bytes());
    ihdr.push(8); // Bit depth: 8
    ihdr.push(6); // Color type: 6 (RGBA)
    ihdr.push(0); // Compression method: 0
    ihdr.push(0); // Filter method: 0
    ihdr.push(0); // Interlace method: 0
    write_chunk(&mut out, b"IHDR", &ihdr);

    // IDAT
    let row_stride = (width * 4) as usize;
    let mut raw_data = Vec::with_capacity((height as usize) * (row_stride + 1));
    for y in 0..height as usize {
        raw_data.push(0); // Filter type 0 (None)
        let row_start = y * row_stride;
        raw_data.extend_from_slice(&rgba[row_start..row_start + row_stride]);
    }

    let mut zlib = Vec::new();
    zlib.push(0x78); // CMF
    zlib.push(0x01); // FLG

    let chunks: Vec<&[u8]> = raw_data.chunks(65535).collect();
    for (i, chunk) in chunks.iter().enumerate() {
        let is_last = i == chunks.len() - 1;
        zlib.push(if is_last { 0x01 } else { 0x00 });
        let len = chunk.len() as u16;
        let nlen = !len;
        zlib.extend_from_slice(&len.to_le_bytes());
        zlib.extend_from_slice(&nlen.to_le_bytes());
        zlib.extend_from_slice(chunk);
    }

    let adler = adler32(&raw_data);
    zlib.extend_from_slice(&adler.to_be_bytes());

    write_chunk(&mut out, b"IDAT", &zlib);

    // IEND
    write_chunk(&mut out, b"IEND", &[]);

    out
}

fn write_chunk(out: &mut Vec<u8>, chunk_type: &[u8; 4], data: &[u8]) {
    out.extend_from_slice(&(data.len() as u32).to_be_bytes());
    out.extend_from_slice(chunk_type);
    out.extend_from_slice(data);

    let mut crc_data = Vec::with_capacity(4 + data.len());
    crc_data.extend_from_slice(chunk_type);
    crc_data.extend_from_slice(data);
    let crc = crc32(&crc_data);
    out.extend_from_slice(&crc.to_be_bytes());
}

fn adler32(data: &[u8]) -> u32 {
    let mut s1: u32 = 1;
    let mut s2: u32 = 0;
    for &b in data {
        s1 = (s1 + b as u32) % 65521;
        s2 = (s2 + s1) % 65521;
    }
    (s2 << 16) | s1
}

fn crc32(data: &[u8]) -> u32 {
    let mut crc: u32 = 0xFFFFFFFF;
    for &b in data {
        crc ^= b as u32;
        for _ in 0..8 {
            if crc & 1 != 0 {
                crc = (crc >> 1) ^ 0xEDB88320;
            } else {
                crc >>= 1;
            }
        }
    }
    !crc
}

fn base64_encode(data: &[u8]) -> String {
    const CHARSET: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut result = String::with_capacity((data.len() + 2) / 3 * 4);
    for chunk in data.chunks(3) {
        let b0 = chunk[0];
        let b1 = chunk.get(1).copied().unwrap_or(0);
        let b2 = chunk.get(2).copied().unwrap_or(0);

        result.push(CHARSET[(b0 >> 2) as usize] as char);
        result.push(CHARSET[(((b0 & 0x03) << 4) | (b1 >> 4)) as usize] as char);
        if chunk.len() > 1 {
            result.push(CHARSET[(((b1 & 0x0F) << 2) | (b2 >> 6)) as usize] as char);
        } else {
            result.push('=');
        }
        if chunk.len() > 2 {
            result.push(CHARSET[(b2 & 0x3F) as usize] as char);
        } else {
            result.push('=');
        }
    }
    result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_explorer_icon() {
        let icon = get_cached_icon("C:\\Windows\\explorer.exe");
        assert!(icon.is_some(), "Explorer icon should be found");
        let data = icon.unwrap();
        assert!(data.starts_with("data:image/png;base64,"), "Icon should be a PNG data URL");
        assert!(data.len() > 100, "Icon data URL should contain base64 content");
    }

    #[test]
    fn test_parse_display_icon() {
        assert_eq!(
            parse_display_icon("\"C:\\Program Files\\App\\app.exe\",0"),
            Some("C:\\Program Files\\App\\app.exe".to_string())
        );
        assert_eq!(
            parse_display_icon("C:\\Program Files\\App\\app.exe,-1"),
            Some("C:\\Program Files\\App\\app.exe".to_string())
        );
    }
}
