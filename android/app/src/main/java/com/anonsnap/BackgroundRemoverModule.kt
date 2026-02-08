package com.anonsnap

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.segmentation.subject.SubjectSegmentation
import com.google.mlkit.vision.segmentation.subject.SubjectSegmenterOptions
import java.io.File
import java.io.FileOutputStream

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

            // Subject Segmentation — works with ANY object (people, animals, characters, etc.)
            val options = SubjectSegmenterOptions.Builder()
                .enableForegroundBitmap()
                .build()

            val segmenter = SubjectSegmentation.getClient(options)

            segmenter.process(image)
                .addOnSuccessListener { result ->
                    try {
                        val foregroundBitmap = result.foregroundBitmap
                        if (foregroundBitmap == null) {
                            promise.reject("E_SEGMENT", "No foreground subject detected")
                            return@addOnSuccessListener
                        }

                        val outputFile = File(
                            reactApplicationContext.cacheDir,
                            "bg_removed_${System.currentTimeMillis()}.png"
                        )
                        FileOutputStream(outputFile).use { out ->
                            foregroundBitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
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
