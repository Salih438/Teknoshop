-- Migration: systemRole varsayılanını ADMIN'den ANALYST'e çekme ve geriye dönük güvenlik temizliği
-- 
-- KARAR NOTU (Phase 16 - FIX-01):
-- 1. Tablo varsayılan değeri 'ANALYST' olarak güncellenir.
-- 2. Eski şemada role='USER' olan kullanıcılar varsayılan olarak 'ADMIN' systemRole almıştı.
--    Güvenlik ilkesi (Least Privilege) gereği, role='USER' olan tüm standart kullanıcıların
--    systemRole değeri 'ANALYST' olarak güncellenir.
-- 3. role='ADMIN' olan mevcut yöneticiler ise mevcut 'ADMIN' systemRole yetkileriyle korunur
--    (mevcut yönetim erişimleri kesilmez; SUPER_ADMIN gerektiren durumlar için bootstrap scripti sunulmuştur).

-- 1. Alter Column Default
ALTER TABLE "User" ALTER COLUMN "systemRole" SET DEFAULT 'ANALYST';

-- 2. Standart (role = 'USER') kullanıcıların geçmişten kalan 'ADMIN' systemRole değerlerini güvenli varsayılana ('ANALYST') çek
UPDATE "User"
SET "systemRole" = 'ANALYST'
WHERE "role" = 'USER' AND "systemRole" = 'ADMIN';
