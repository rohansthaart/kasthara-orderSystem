ALTER TABLE "LabelSetting" ALTER COLUMN "widthMm" SET DEFAULT 48;
ALTER TABLE "LabelSetting" ALTER COLUMN "heightMm" SET DEFAULT 30;

UPDATE "LabelSetting"
SET "widthMm" = 48,
    "heightMm" = 30,
    "fontSize" = 8
WHERE "name" = 'Default';
