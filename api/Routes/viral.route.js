import express from 'express';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const router = express.Router();

router.post('/generate-video', async (req, res) => {
  const { imageUrls, artistName, schoolName } = req.body;

  if (!imageUrls || imageUrls.length === 0) {
    return res.status(400).json({ success: false, message: "No media provided" });
  }

  const tempDir = path.join(process.cwd(), 'temp_video_workspace');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
  
  const outputFileName = `Arena_${artistName}_${Date.now()}.mp4`;
  const outputPath = path.join(tempDir, outputFileName);

  try {
    console.log(`📥 Downloading ${imageUrls.length} media assets...`);
    
    // 🏎️ SPEED BOOST 1: Smart Image vs Video File Type Detection & Safe Downloading
    const localMedia = await Promise.all(
      imageUrls.map(async (url, i) => {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch media ${i}`);
        
        const isVideo = url.match(/\.(mp4|webm|ogg|mov)/i);
        const ext = isVideo ? '.mp4' : '.jpg';
        const localPath = path.join(tempDir, `slide_${i}${ext}`);
        
        const fileStream = fs.createWriteStream(localPath);
        await pipeline(Readable.fromWeb(response.body), fileStream);
        
        
        return { path: localPath, isVideo };
      })
    );

    console.log("🎬 Starting High-Performance FFmpeg Render Engine...");
    let command = ffmpeg();-

    // Input all downloaded media files sequentially
    localMedia.forEach((media) => {
      if (media.isVideo) {
        command = command.input(media.path);
      } else {
        command = command.input(media.path).inputOptions([
          '-loop 1',      
          '-t 3',         
          '-framerate 30' 
        ]);
      }
    });

    const filterArray = [];

    // Layout background scaling, optimized boxblur, and hero scaling
    localMedia.forEach((_, i) => {
      // 🏎️ SPEED BOOST 2: Fake blur via bilinear scale shrinking down to 10% and blowing up
      filterArray.push(`[${i}:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,scale=108:192,scale=1080:1920:flags=bilinear,colorchannelmixer=rr=0.35:gg=0.35:bb=0.35[bg${i}]`);
      filterArray.push(`[${i}:v]scale=1080:1920:force_original_aspect_ratio=decrease,scale=iw*1.45:ih*1.45[fg${i}]`);
      
      // Force a rigid 30fps/yuv420p to prevent concatenation mismatch dropping clips
      filterArray.push(`[bg${i}][fg${i}]overlay=(W-w)/2:(H-h)/2:format=auto,setsar=1,fps=30,format=yuv420p[v${i}]`);
    });

    // 🛠️ THE CRITICAL FIX: Handle single vs multiple inputs perfectly
    if (localMedia.length > 1) {
      const concatInputs = localMedia.map((_, i) => `[v${i}]`).join('');
      filterArray.push(`${concatInputs}concat=n=${localMedia.length}:v=1:a=0[baseVideo]`);
    } else {
      // If only 1 video was sent (Button 1 clicked), safely route it to the stamper without concatenating
      filterArray.push(`[v0]format=yuv420p[baseVideo]`);
    }

    // =========================================================================
    // 💎 ASH EFFIGY TYPOGRAPHY HUD (Hardcoded Stamping Engine)
    // =========================================================================
    filterArray.push(
      // Ghost Watermarks (Low opacity background text)
      `[baseVideo]drawtext=text='MASTERPIECE':font='Courier New':fontcolor=white@0.15:fontsize=150:x=-50:y=(h-text_h)/3,` +
      `drawtext=text='YENUVIA':font='Courier New':fontcolor=white@0.15:fontsize=120:x=w-text_w+50:y=(h-text_h)/1.5,` +
      
      // Top Live Header
      `drawtext=text='LIVE YENUVIA BILLBOARD':font='Courier New':fontcolor=white:fontsize=20:x=(w-text_w)/2:y=80:box=1:boxcolor=red@0.8:boxborderw=10,` +
      `drawtext=text='VISION & PRESTIGE!':font='Courier New':fontcolor=white:fontsize=55:x=(w-text_w)/2:y=140:shadowcolor=black@0.9:shadowx=4:shadowy=4,` +
      
      // Left Flank (Ash text - #e4e4e7 / #a1a1aa)
      `drawtext=text='EXCLUSIVE':font='Courier New':fontcolor=#e4e4e7:fontsize=45:x=50:y=(h/2)-120:shadowcolor=black@0.8:shadowx=3:shadowy=3,` +
      `drawtext=text='SHOWCASE':font='Courier New':fontcolor=#e4e4e7:fontsize=45:x=50:y=(h/2)-70:shadowcolor=black@0.8:shadowx=3:shadowy=3,` +
      `drawtext=text='UNRIVALED BRILLIANCE':font='Courier New':fontcolor=#a1a1aa:fontsize=22:x=50:y=(h/2)-20:shadowcolor=black@0.8:shadowx=2:shadowy=2,` +

      // Right Flank 
      `drawtext=text='HALL OF':font='Courier New':fontcolor=#e4e4e7:fontsize=45:x=w-text_w-50:y=(h/2)+50:shadowcolor=black@0.8:shadowx=3:shadowy=3,` +
      `drawtext=text='FAME':font='Courier New':fontcolor=#e4e4e7:fontsize=45:x=w-text_w-50:y=(h/2)+100:shadowcolor=black@0.8:shadowx=3:shadowy=3,` +
      `drawtext=text='WITNESS GREATNESS':font='Courier New':fontcolor=#a1a1aa:fontsize=22:x=w-text_w-50:y=(h/2)+150:shadowcolor=black@0.8:shadowx=2:shadowy=2,` +

      // Bottom Footer
      `drawtext=text='YENUVIA HALL OF FAME':font='Courier New':fontcolor=white:fontsize=65:x=(w-text_w)/2:y=h-250:shadowcolor=black@0.8:shadowx=4:shadowy=4,` +
      `drawtext=text='INSPIRE. ACHIEVE. SUCCEED.':font='Courier New':fontcolor=#a1a1aa:fontsize=25:x=(w-text_w)/2:y=h-170[outv]`
    );

    // 🚀 MAX CPU THREADS & OPTIMIZATION
    command
      .complexFilter(filterArray)
      .outputOptions([
        '-map [outv]',
        '-pix_fmt yuv420p', 
        '-c:v libx264',     
        '-crf 26',          
        '-preset ultrafast',
        '-threads 0',       // 🚀 Forces FFmpeg to use ALL available CPU cores
        '-r 30'             
      ])
      .save(outputPath)
      .on('end', () => {
        console.log('🎬 Ash Effigy Masterpiece compiled successfully!');
        res.download(outputPath, outputFileName, (err) => {
          // Cleanup temp workspace
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
          localMedia.forEach(media => {
            if (fs.existsSync(media.path)) fs.unlinkSync(media.path);
          });
        });
      })
      .on('error', (err) => {
        console.error('Error generating video:', err);
        res.status(500).json({ success: false, message: "Video generation failed" });
      });

  } catch (error) {
    console.error("Backend Error:", error);
    res.status(500).json({ success: false, message: "Server error during video processing" });
  }
});

export default router;