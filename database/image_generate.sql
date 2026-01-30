-- Add to your existing init_db.sql file
-- Or run this separately to add text-to-image tables

USE VQA_DB;
GO

-- Table to store generated images with prompts and metadata
CREATE TABLE GeneratedImages (
    GeneratedImageID INT PRIMARY KEY IDENTITY(1,1),
    Prompt NVARCHAR(MAX) NOT NULL,
    NegativePrompt NVARCHAR(MAX),
    FilePath NVARCHAR(500) NOT NULL,
    FileName NVARCHAR(255) NOT NULL,
    
    -- Generation parameters
    Seed INT,
    NumInferenceSteps INT DEFAULT 30,
    GuidanceScale FLOAT DEFAULT 7.5,
    ImageWidth INT DEFAULT 512,
    ImageHeight INT DEFAULT 512,
    
    -- Metadata
    GenerationTime DATETIME DEFAULT GETDATE(),
    GenerationDuration FLOAT, -- in seconds
    ModelUsed NVARCHAR(100) DEFAULT 'stable-diffusion-2-1',
    
    -- Optional: User tracking if you implement authentication
    UserID INT NULL,
    
    -- Status tracking
    Status NVARCHAR(50) DEFAULT 'completed', -- completed, failed, processing
    ErrorMessage NVARCHAR(MAX) NULL,
    
    -- File info
    FileSize BIGINT, -- in bytes
    
    -- Engagement tracking
    ViewCount INT DEFAULT 0,
    DownloadCount INT DEFAULT 0,
    
    -- Indexing for faster queries
    INDEX IX_GeneratedImages_GenerationTime (GenerationTime DESC),
    INDEX IX_GeneratedImages_Seed (Seed)
);
GO

-- Table to store user favorites (optional feature)
CREATE TABLE ImageFavorites (
    FavoriteID INT PRIMARY KEY IDENTITY(1,1),
    GeneratedImageID INT FOREIGN KEY REFERENCES GeneratedImages(GeneratedImageID) ON DELETE CASCADE,
    UserID INT NULL, -- For future user authentication
    FavoritedAt DATETIME DEFAULT GETDATE(),
    
    INDEX IX_ImageFavorites_GeneratedImageID (GeneratedImageID)
);
GO

-- Table to store generation variations/iterations
CREATE TABLE ImageVariations (
    VariationID INT PRIMARY KEY IDENTITY(1,1),
    OriginalImageID INT FOREIGN KEY REFERENCES GeneratedImages(GeneratedImageID),
    VariationImageID INT FOREIGN KEY REFERENCES GeneratedImages(GeneratedImageID),
    VariationType NVARCHAR(50), -- 'seed_variation', 'prompt_modification', 'parameter_change'
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- Table to track popular prompts and tags
CREATE TABLE PromptTags (
    TagID INT PRIMARY KEY IDENTITY(1,1),
    GeneratedImageID INT FOREIGN KEY REFERENCES GeneratedImages(GeneratedImageID) ON DELETE CASCADE,
    TagName NVARCHAR(100) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    
    INDEX IX_PromptTags_TagName (TagName),
    INDEX IX_PromptTags_GeneratedImageID (GeneratedImageID)
);
GO

-- View to get images with their statistics
CREATE VIEW vw_GeneratedImagesStats AS
SELECT 
    gi.GeneratedImageID,
    gi.Prompt,
    gi.NegativePrompt,
    gi.FilePath,
    gi.FileName,
    gi.Seed,
    gi.NumInferenceSteps,
    gi.GuidanceScale,
    gi.ImageWidth,
    gi.ImageHeight,
    gi.GenerationTime,
    gi.GenerationDuration,
    gi.ModelUsed,
    gi.Status,
    gi.ViewCount,
    gi.DownloadCount,
    gi.FileSize,
    COUNT(DISTINCT f.FavoriteID) as FavoriteCount,
    COUNT(DISTINCT pt.TagID) as TagCount
FROM GeneratedImages gi
LEFT JOIN ImageFavorites f ON gi.GeneratedImageID = f.GeneratedImageID
LEFT JOIN PromptTags pt ON gi.GeneratedImageID = pt.GeneratedImageID
GROUP BY 
    gi.GeneratedImageID, gi.Prompt, gi.NegativePrompt, gi.FilePath, 
    gi.FileName, gi.Seed, gi.NumInferenceSteps, gi.GuidanceScale,
    gi.ImageWidth, gi.ImageHeight, gi.GenerationTime, gi.GenerationDuration,
    gi.ModelUsed, gi.Status, gi.ViewCount, gi.DownloadCount, gi.FileSize;
GO

-- Stored procedure to get recent generations
CREATE PROCEDURE sp_GetRecentGenerations
    @TopCount INT = 50
AS
BEGIN
    SELECT TOP (@TopCount)
        GeneratedImageID,
        Prompt,
        FilePath,
        FileName,
        Seed,
        GenerationTime,
        ImageWidth,
        ImageHeight,
        ViewCount,
        DownloadCount
    FROM GeneratedImages
    WHERE Status = 'completed'
    ORDER BY GenerationTime DESC;
END;
GO

-- Stored procedure to search images by prompt
CREATE PROCEDURE sp_SearchGeneratedImages
    @SearchTerm NVARCHAR(255)
AS
BEGIN
    SELECT 
        GeneratedImageID,
        Prompt,
        NegativePrompt,
        FilePath,
        FileName,
        Seed,
        GenerationTime,
        ViewCount,
        DownloadCount
    FROM GeneratedImages
    WHERE Status = 'completed'
        AND (Prompt LIKE '%' + @SearchTerm + '%' 
             OR NegativePrompt LIKE '%' + @SearchTerm + '%')
    ORDER BY GenerationTime DESC;
END;
GO

-- Stored procedure to increment view count
CREATE PROCEDURE sp_IncrementViewCount
    @GeneratedImageID INT
AS
BEGIN
    UPDATE GeneratedImages
    SET ViewCount = ViewCount + 1
    WHERE GeneratedImageID = @GeneratedImageID;
END;
GO

-- Stored procedure to increment download count
CREATE PROCEDURE sp_IncrementDownloadCount
    @GeneratedImageID INT
AS
BEGIN
    UPDATE GeneratedImages
    SET DownloadCount = DownloadCount + 1
    WHERE GeneratedImageID = @GeneratedImageID;
END;
GO

-- Sample queries for analytics

-- Get most popular prompts
-- SELECT TOP 10 
--     Prompt, 
--     COUNT(*) as UsageCount,
--     AVG(ViewCount) as AvgViews,
--     AVG(DownloadCount) as AvgDownloads
-- FROM GeneratedImages
-- WHERE Status = 'completed'
-- GROUP BY Prompt
-- ORDER BY UsageCount DESC;

-- Get generation statistics by date
-- SELECT 
--     CAST(GenerationTime AS DATE) as GenerationDate,
--     COUNT(*) as ImagesGenerated,
--     AVG(GenerationDuration) as AvgDuration,
--     SUM(FileSize) as TotalStorageUsed
-- FROM GeneratedImages
-- WHERE Status = 'completed'
-- GROUP BY CAST(GenerationTime AS DATE)
-- ORDER BY GenerationDate DESC;