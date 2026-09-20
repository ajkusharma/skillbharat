package com.skillbharat.storage;

import org.springframework.core.io.Resource;

import java.io.IOException;
import java.io.InputStream;

/**
 * Storage abstraction for resumes. The MVP ships a local-disk implementation; an S3/GCS/Azure Blob
 * implementation can replace it without touching any business code.
 */
public interface FileStorage {

    void store(String key, InputStream content) throws IOException;

    Resource load(String key);
}
