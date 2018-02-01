# cucumber_docx
express API endpoint to send docx files containing vars + dict context and returns a docx with the vars replaced. It uses docxtemplater node library.

To decrypt the .p12 file to a .pem file:

openssl pkcs12 -in drive_key.p12 -out drive_key.pem -nocerts -nodes

(password: notasecret)
