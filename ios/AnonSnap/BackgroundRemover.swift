import Foundation
import Vision
import UIKit
import CoreImage

@objc(BackgroundRemover)
@available(iOS 17.0, *)
class BackgroundRemover: NSObject {

  @objc
  func removeBackground(_ inputPath: String,
                         resolver resolve: @escaping RCTPromiseResolveBlock,
                         rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.global(qos: .userInitiated).async {
      do {
        let cleanPath = inputPath.replacingOccurrences(of: "file://", with: "")
        guard let inputImage = UIImage(contentsOfFile: cleanPath),
              let cgImage = inputImage.cgImage else {
          reject("E_LOAD", "Failed to load image", nil)
          return
        }

        let originalCI = CIImage(cgImage: cgImage)
        let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])

        // Foreground instance mask — works with ANY object (people, animals, characters, etc.)
        let request = VNGenerateForegroundInstanceMaskRequest()
        try handler.perform([request])

        guard let result = request.results?.first else {
          reject("E_SEGMENT", "No foreground object detected", nil)
          return
        }

        let maskBuffer = try result.generateScaledMaskForImage(
          forInstances: result.allInstances,
          from: handler
        )
        let maskImage = CIImage(cvPixelBuffer: maskBuffer)

        // Apply mask: blend original with transparent background
        guard let filter = CIFilter(name: "CIBlendWithMask") else {
          reject("E_FILTER", "CIBlendWithMask filter not available", nil)
          return
        }
        filter.setValue(originalCI, forKey: kCIInputImageKey)
        filter.setValue(CIImage(color: .clear).cropped(to: originalCI.extent),
                        forKey: kCIInputBackgroundImageKey)
        filter.setValue(maskImage, forKey: kCIInputMaskImageKey)

        guard let outputCI = filter.outputImage else {
          reject("E_FILTER", "Mask application failed", nil)
          return
        }

        let context = CIContext()
        let outputPath = NSTemporaryDirectory() + "bg_removed_\(Int(Date().timeIntervalSince1970 * 1000)).png"
        let outputURL = URL(fileURLWithPath: outputPath)

        guard let colorSpace = CGColorSpace(name: CGColorSpace.sRGB) else {
          reject("E_RENDER", "Failed to create color space", nil)
          return
        }
        try context.writePNGRepresentation(of: outputCI, to: outputURL, format: .RGBA8, colorSpace: colorSpace)
        resolve("file://" + outputPath)
      } catch {
        reject("E_BG_REMOVE", error.localizedDescription, error)
      }
    }
  }

  @objc
  static func requiresMainQueueSetup() -> Bool { false }
}
