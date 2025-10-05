from fastapi import UploadFile, File


def get_analyze_image(image: UploadFile = File(...)):
    #run img analyzation
    
    # return data
    return {
        "text": "",
        "visual": "",
        "emotinal": "",
        "suggestions": [],
        "score": 0
    }





