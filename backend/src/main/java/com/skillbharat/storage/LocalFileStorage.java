package com.skillbharat.storage;

import com.skillbharat.common.ApiException;
import com.skillbharat.config.AppProperties;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Component
public class LocalFileStorage implements FileStorage {

    private final Path root;

    public LocalFileStorage(AppProperties props) {
        this.root = Paths.get(props.storage().localDir()).toAbsolutePath().normalize();
        try {
            Files.createDirectories(root);
        } catch (IOException e) {
            throw new IllegalStateException("Cannot create resume storage directory " + root, e);
        }
    }

    @Override
    public void store(String key, InputStream content) throws IOException {
        Files.copy(content, resolve(key), StandardCopyOption.REPLACE_EXISTING);
    }

    @Override
    public Resource load(String key) {
        Path path = resolve(key);
        if (!Files.isReadable(path)) {
            throw ApiException.notFound("The resume file is no longer available");
        }
        return new FileSystemResource(path);
    }

    /** Keys are server-generated UUIDs, but never trust a path: refuse anything that escapes the root. */
    private Path resolve(String key) {
        Path path = root.resolve(key).normalize();
        if (!path.startsWith(root)) {
            throw new IllegalArgumentException("Invalid storage key");
        }
        return path;
    }
}
