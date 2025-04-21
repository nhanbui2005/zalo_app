import { RouteProp } from '@react-navigation/native';
import React, { useState } from 'react';
import { View, Button, Dimensions, Alert } from 'react-native';
import RNFS from 'react-native-fs';
import Pdf from 'react-native-pdf';
import { MainStackParamList } from '~/routers/types';

type PDFViewerScreenRouteProp = RouteProp<MainStackParamList, 'PDFViewerScreen'>;

type Props = {
  route: PDFViewerScreenRouteProp;
};
export default function PDFViewerScreen({ route }: Props) {
  const { pdfUrl } = route.params;
  const [pdfPath, setPdfPath] = useState('');
console.log('pdf', pdfUrl);

  const handleDownloadPDF = async () => {
    try {
      // Đường dẫn lưu file PDF trong bộ nhớ trong của ứng dụng
      const destPath = `${RNFS.DocumentDirectoryPath}/downloadedFile.pdf`;

      // Tải file từ URL về bộ nhớ trong
      const download = RNFS.downloadFile({
        fromUrl: pdfUrl,
        toFile: destPath,
      });

      // Chờ quá trình tải hoàn tất
      const result = await download.promise;

      if (result.statusCode === 200) {
        console.log('File đã được tải về:', destPath);
        setPdfPath(destPath);
      } else {
        throw new Error(`Lỗi tải file, mã lỗi: ${result.statusCode}`);
      }
    } catch (err) {
      console.warn('Lỗi tải file:', err);
      Alert.alert('Lỗi', 'Không thể tải file PDF. Vui lòng thử lại.');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {!pdfPath ? (
        <Button title="Tải file PDF" onPress={handleDownloadPDF} />
      ) : (
        <Pdf
          source={{ uri: `file://${pdfPath}` }}
          style={{
            flex: 1,
            width: Dimensions.get('window').width,
          }}
          onError={(error) => {
            console.log('Lỗi hiển thị PDF:', error);
            Alert.alert('Lỗi', 'Không thể hiển thị file PDF.');
          }}
        />
      )}
    </View>
  );
}
