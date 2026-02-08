#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(BackgroundRemover, NSObject)
RCT_EXTERN_METHOD(removeBackground:(NSString *)inputPath
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
@end
