using System.Security.Cryptography;

namespace HideandSeek.Server.Services;

/// <summary>
/// Interface for encrypting and decrypting OAuth tokens at rest.
/// </summary>
public interface ITokenEncryptionService
{
    string Encrypt(string plaintext);
    string Decrypt(string ciphertext);
}

/// <summary>
/// Encrypts/decrypts OAuth tokens using AES-256-GCM.
/// Key is derived from a configured secret via HKDF.
/// Ciphertext format: Base64(nonce + ciphertext + tag)
/// </summary>
public class TokenEncryptionService : ITokenEncryptionService
{
    private readonly byte[] _key;

    public TokenEncryptionService(IConfiguration configuration)
    {
        var secret = configuration["TokenEncryption:Key"]
            ?? throw new InvalidOperationException("TokenEncryption:Key must be configured.");

        // Derive a 256-bit key from the configured secret using HKDF
        var inputBytes = System.Text.Encoding.UTF8.GetBytes(secret);
        _key = HKDF.DeriveKey(HashAlgorithmName.SHA256, inputBytes, 32, info: System.Text.Encoding.UTF8.GetBytes("oauth-token-encryption"));
    }

    public string Encrypt(string plaintext)
    {
        if (string.IsNullOrEmpty(plaintext)) return plaintext;

        var plaintextBytes = System.Text.Encoding.UTF8.GetBytes(plaintext);
        var nonce = new byte[AesGcm.NonceByteSizes.MaxSize]; // 12 bytes
        RandomNumberGenerator.Fill(nonce);

        var ciphertext = new byte[plaintextBytes.Length];
        var tag = new byte[AesGcm.TagByteSizes.MaxSize]; // 16 bytes

        using var aes = new AesGcm(_key, AesGcm.TagByteSizes.MaxSize);
        aes.Encrypt(nonce, plaintextBytes, ciphertext, tag);

        // Format: nonce (12) + ciphertext (N) + tag (16)
        var result = new byte[nonce.Length + ciphertext.Length + tag.Length];
        nonce.CopyTo(result, 0);
        ciphertext.CopyTo(result, nonce.Length);
        tag.CopyTo(result, nonce.Length + ciphertext.Length);

        return Convert.ToBase64String(result);
    }

    public string Decrypt(string encryptedText)
    {
        if (string.IsNullOrEmpty(encryptedText)) return encryptedText;

        var data = Convert.FromBase64String(encryptedText);

        var nonceSize = AesGcm.NonceByteSizes.MaxSize; // 12
        var tagSize = AesGcm.TagByteSizes.MaxSize; // 16
        var ciphertextSize = data.Length - nonceSize - tagSize;

        if (ciphertextSize < 0)
            throw new CryptographicException("Invalid encrypted data.");

        var nonce = data.AsSpan(0, nonceSize);
        var ciphertext = data.AsSpan(nonceSize, ciphertextSize);
        var tag = data.AsSpan(nonceSize + ciphertextSize, tagSize);

        var plaintext = new byte[ciphertextSize];
        using var aes = new AesGcm(_key, AesGcm.TagByteSizes.MaxSize);
        aes.Decrypt(nonce, ciphertext, tag, plaintext);

        return System.Text.Encoding.UTF8.GetString(plaintext);
    }
}
