import os
from PIL import Image

def crop_assets():
    # Source image path
    src_path = "/Users/igor.pesic/Desktop/MARKETPLACE Design/Export/Z - new home (start).png"
    if not os.path.exists(src_path):
        print(f"Error: Source image not found at {src_path}")
        return

    img = Image.open(src_path)
    print(f"Source image loaded: {img.size[0]}x{img.size[1]}px")

    # Create public directory in project root
    dest_dir = "public"
    os.makedirs(dest_dir, exist_ok=True)
    print(f"Created destination directory: {dest_dir}")

    # Bounding boxes definitions (x1, y1, x2, y2)
    # Based on 1512x3512 dimensions
    crops = {
        # 1. Hero Banners
        "hero_vacsy.png": (40, 140, 380, 290),
        "hero_bioptron.png": (396, 140, 1116, 340),
        "hero_pots.png": (1132, 140, 1472, 290),
        "hero_eyewear.png": (40, 306, 380, 646),
        "hero_air.png": (396, 356, 746, 586),
        "hero_cream.png": (766, 356, 1116, 586),
        "hero_bag.png": (1132, 306, 1472, 746),
        "hero_perfume.png": (40, 662, 380, 812),
        "hero_bizzclub.png": (396, 602, 1116, 746),

        # 2. Featured Section
        "product_bioptron_pro1.png": (40, 940, 380, 1220),
        "product_eyewear_clips.png": (396, 940, 746, 1220),
        "product_myionz_pro.png": (766, 940, 1116, 1220),
        "banner_prirodna_lepota.png": (1132, 940, 1472, 1560),

        # 3. Secondary Grid
        "banner_bioptron_terapija.png": (40, 1590, 746, 1910),
        "banner_preciscena_voda.png": (766, 1590, 1116, 1740),
        "banner_prirodna_lepota_mid.png": (766, 1760, 1116, 1910),
        "banner_priprema_hrane_tall.png": (1132, 1590, 1472, 1910),

        # 4. Promotions Section
        "promo_water_banner.png": (40, 2320, 746, 3080),
        "product_aqueena_pro.png": (766, 2320, 1116, 2600),
        "product_edelwasser_gold.png": (1132, 2320, 1472, 2600),
    }

    # Slice and save each image
    for filename, bbox in crops.items():
        try:
            cropped = img.crop(bbox)
            save_path = os.path.join(dest_dir, filename)
            cropped.save(save_path, "PNG")
            print(f"Saved: {save_path} ({cropped.size[0]}x{cropped.size[1]}px)")
        except Exception as e:
            print(f"Failed to crop {filename}: {e}")

if __name__ == "__main__":
    crop_assets()
