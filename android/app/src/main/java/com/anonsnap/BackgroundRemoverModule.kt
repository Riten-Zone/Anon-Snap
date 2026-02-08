package com.anonsnap

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.segmentation.Segmentation
import com.google.mlkit.vision.segmentation.selfie.SelfieSegmenterOptions
import java.io.File
import java.io.FileOutputStream
import java.nio.ByteOrder

class BackgroundRemoverModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "BackgroundRemover"

    @ReactMethod
    fun removeBackground(inputPath: String, promise: Promise) {
        try {
            val cleanPath = inputPath.replace("file://", "")
            val bitmap = BitmapFactory.decodeFile(cleanPath)
                ?: return promise.reject("E_LOAD", "Failed to load image")

            val image = InputImage.fromBitmap(bitmap, 0)

            val options = SelfieSegmenterOptions.Builder()
                .setDetectorMode(SelfieSegmenterOptions.SINGLE_IMAGE_MODE)
                .enableRawSizeMask()
                .build()

            val segmenter = Segmentation.getClient(options)

            segmenter.process(image)
                .addOnSuccessListener { segmentationMask ->
                    try {
                        val mask = segmentationMask.buffer
                        mask.order(ByteOrder.nativeOrder())
                        val maskWidth = segmentationMask.width
                        val maskHeight = segmentationMask.height

                        val outputBitmap = bitmap.copy(Bitmap.Config.ARGB_8888, true)
                        val scaleX = bitmap.width.toFloat() / maskWidth
                        val scaleY = bitmap.height.toFloat() / maskHeight

                        for (y in 0 until bitmap.height) {
                            for (x in 0 until bitmap.width) {
                                val maskX = (x / scaleX).toInt().coerceIn(0, maskWidth - 1)
                                val maskY = (y / scaleY).toInt().coerceIn(0, maskHeight - 1)
                                mask.position(maskY * maskWidth * 4 + maskX * 4)
                                val confidence = mask.getFloat()
                                if (confidence < 0.5f) {
                                    outputBitmap.setPixel(x, y, Color.TRANSPARENT)
                                }
                            }
                        }

                        val outputFile = File(
                            reactApplicationContext.cacheDir,
                            "bg_removed_${System.currentTimeMillis()}.png"
                        )
                        FileOutputStream(outputFile).use { out ->
                            outputBitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
                        }

                        promise.resolve("file://${outputFile.absolutePath}")
                    } catch (e: Exception) {
                        promise.reject("E_PROCESS", e.message, e)
                    }
                }
                .addOnFailureListener { e ->
                    promise.reject("E_SEGMENT", e.message, e)
                }
        } catch (e: Exception) {
            promise.reject("E_BG_REMOVE", e.message, e)
        }
    }
}
