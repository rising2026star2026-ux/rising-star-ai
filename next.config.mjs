/** @type {import('next').NextConfig} */
const nextConfig = {
  // msedge-tts بيعتمد على ws، وتجميعها جوه Next بيبوّظ (b.mask is not a function). بنسيبهم برّه الـbundle
  serverExternalPackages: ["msedge-tts", "ws"],
};
export default nextConfig;
