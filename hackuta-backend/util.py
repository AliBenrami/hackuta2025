from boto3 import client
import os
import uuid
from typing import BinaryIO, Union, Dict
from io import BytesIO

def upload_image(file_obj: BinaryIO, bucket: str, filename: str, key: Union[str, None] = None, content_type: Union[str, None] = None) -> Dict[str, str]:
    """
    Upload a file object directly to S3.
    Args:
        file_obj: File object to upload (e.g., from FastAPI UploadFile.file).
        bucket: Target S3 bucket name.
        filename: Original filename to extract extension.
        key: Desired object key (optional). If None, one is generated.
        content_type: MIME type (optional).
    Returns:
        Dictionary containing the S3 object key and presigned URL:
        {
            "key": "uploads/uuid-filename.ext",
            "url": "https://bucket.s3.amazonaws.com/uploads/uuid-filename.ext?..."
        }
    """

    s3 = client("s3")

    if key is None:
        ext = os.path.splitext(filename)[1]
        key = f"uploads/{uuid.uuid4()}{ext}"

    extra_args = {}
    if content_type:
        extra_args["ContentType"] = content_type

    try:
        if extra_args:
            s3.upload_fileobj(file_obj, bucket, key, ExtraArgs=extra_args)
        else:
            s3.upload_fileobj(file_obj, bucket, key)
    except Exception as e:
        raise RuntimeError(f"Failed to upload {filename} to s3://{bucket}/{key}: {e}") from e
    
    # Generate presigned URL for the uploaded image
    try:
        url = s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': bucket, 'Key': key},
            ExpiresIn=3600  # 1 hour expiration
        )
    except Exception as e:
        raise RuntimeError(f"Failed to generate presigned URL for uploaded image s3://{bucket}/{key}: {e}") from e
    
    return {
        "key": key,
        "url": url
    }

def download_image(bucket: str, key: str) -> BytesIO:
    """
    Download an image from S3 and return it as a BytesIO object.
    Args:
        bucket: S3 bucket name containing the image.
        key: S3 object key (path) of the image to download.
    Returns:
        BytesIO object containing the image data.
    Raises:
        RuntimeError: If the download fails.
    """
    
    s3 = client("s3")
    
    try:
        # Create a BytesIO buffer to store the downloaded data
        image_buffer = BytesIO()
        
        # Download the file from S3 into the buffer
        s3.download_fileobj(bucket, key, image_buffer)
        
        # Reset the buffer position to the beginning
        image_buffer.seek(0)
        
        return image_buffer
        
    except Exception as e:
        raise RuntimeError(f"Failed to download image from s3://{bucket}/{key}: {e}") from e

def get_image_url(bucket: str, key: str, expiration: int = 3600) -> str:
    """
    Generate a presigned URL for an image in S3.
    Args:
        bucket: S3 bucket name containing the image.
        key: S3 object key (path) of the image.
        expiration: URL expiration time in seconds (default: 1 hour).
    Returns:
        Presigned URL string that can be used to access the image.
    Raises:
        RuntimeError: If URL generation fails.
    """
    
    s3 = client("s3")
    
    try:
        url = s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': bucket, 'Key': key},
            ExpiresIn=expiration
        )
        return url
        
    except Exception as e:
        raise RuntimeError(f"Failed to generate presigned URL for s3://{bucket}/{key}: {e}") from e
