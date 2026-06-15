import React, { useRef } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import styles from './index.module.scss';
import { useDiaryStore } from '@/store/useDiaryStore';
import CheckInCalendar from '@/components/CheckInCalendar';
import BadgeIcon from '@/components/BadgeIcon';
import { getCurrentMonth, getMonthDates, formatDate } from '@/utils/date';
import { getEmotionByType, extractKeywords, getEmotionScore } from '@/utils/emotion';
import { EmotionType } from '@/types';

const MonthlyReportPage: React.FC = () => {
  const diaries = useDiaryStore(state => state.diaries);
  const badges = useDiaryStore(state => state.badges);
  const posts = useDiaryStore(state => state.posts);
  const reportRef = useRef<HTMLDivElement>(null);

  const month = getCurrentMonth();
  const monthDates = getMonthDates(month);
  const monthDiaries = diaries.filter(d => d.date.startsWith(month));

  const totalCheckIns = monthDiaries.length;
  const checkInRate = Math.round((totalCheckIns / monthDates.length) * 100);

  const emotionCount: Record<EmotionType, number> = {
    happy: 0, calm: 0, sad: 0, anxious: 0, angry: 0, tired: 0
  };
  let totalScore = 0;
  monthDiaries.forEach(d => {
    emotionCount[d.emotion] = (emotionCount[d.emotion] || 0) + 1;
    totalScore += getEmotionScore(d.emotion);
  });

  let mostCommonEmotion: EmotionType = 'calm';
  let maxCount = 0;
  (Object.entries(emotionCount) as [EmotionType, number][]).forEach(([type, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mostCommonEmotion = type;
    }
  });

  const avgScore = totalCheckIns > 0 ? (totalScore / totalCheckIns).toFixed(1) : '0.0';

  const keywords = extractKeywords(monthDiaries.map(d => d.content));

  const monthPosts = posts.filter(p => {
    const postMonth = new Date(p.createdAt).toISOString().slice(0, 7);
    return postMonth === month;
  });

  const unlockedThisMonth = badges.filter(b => b.unlocked && b.unlockedAt &&
    new Date(b.unlockedAt).toISOString().slice(0, 7) === month
  );

  const totalLikes = monthPosts.reduce((sum, p) => sum + p.likes, 0);
  const totalComments = monthPosts.reduce((sum, p) => sum + p.comments, 0);

  const mostCommonEmotionData = getEmotionByType(mostCommonEmotion);

  const getMoodSummary = () => {
    const score = parseFloat(avgScore);
    if (score >= 4) return '本月心情总体积极向上，继续保持这份好心情！';
    if (score >= 3) return '本月心情较为平稳，生活张弛有度。';
    if (score >= 2) return '本月有些起伏，记得多关照自己。';
    return '本月情绪偏低，别忘了关爱自己，多做让自己开心的事。';
  };

  const handleExport = async () => {
    try {
      Taro.showLoading({ title: '正在生成PDF...', mask: true });

      const exportBtn = document.getElementById('export-btn');
      if (exportBtn) {
        exportBtn.style.display = 'none';
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      const reportElement = reportRef.current as unknown as HTMLElement;
      if (!reportElement) {
        throw new Error('无法获取报告内容');
      }

      console.log('[PDF] 开始截图，元素高度:', reportElement.scrollHeight);

      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FFF8F5',
        logging: true,
        windowWidth: reportElement.scrollWidth,
        windowHeight: reportElement.scrollHeight
      });

      if (exportBtn) {
        exportBtn.style.display = 'block';
      }

      console.log('[PDF] 截图完成，canvas尺寸:', { width: canvas.width, height: canvas.height });

      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      console.log('[PDF] PDF页面尺寸:', { pageWidth, pageHeight, imgWidth, imgHeight });

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      let pageCount = 1;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        pageCount++;
      }

      // 页脚
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(9);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`心语日记 · 月度报告 · 第 ${i} 页 / 共 ${pageCount} 页`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }

      const pdfOutput = pdf.output('blob');
      const url = URL.createObjectURL(pdfOutput);

      Taro.hideLoading();

      console.log('[PDF] 生成成功，共', pageCount, '页');

      Taro.showModal({
        title: 'PDF生成成功！',
        content: '文件已生成，点击确定保存或打开。',
        confirmText: '保存',
        success: (res) => {
          if (res.confirm) {
            try {
              const a = document.createElement('a');
              a.href = url;
              a.download = `月度报告_${month}.pdf`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              Taro.showToast({ title: '已开始下载', icon: 'success' });
            } catch (e) {
              Taro.showModal({
                title: '打开PDF',
                content: '在新窗口中打开PDF报告',
                success: (r) => {
                  if (r.confirm) {
                    window.open(url, '_blank');
                  }
                }
              });
            }
          }
        }
      });

    } catch (error) {
      console.error('[PDF] 生成失败:', error);
      Taro.hideLoading();
      const exportBtn = document.getElementById('export-btn');
      if (exportBtn) {
        exportBtn.style.display = 'block';
      }
      Taro.showToast({
        title: '生成失败，请重试',
        icon: 'none'
      });
    }
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View ref={reportRef as any} className={styles.reportContent}>
        <View className={styles.header}>
          <Text className={styles.title}>月度综合报告</Text>
          <Text className={styles.month}>{month.slice(0, 4)}年{month.slice(5)}月</Text>
        </View>

        <View className={styles.summaryCard}>
          <View className={styles.summaryEmoji}>{mostCommonEmotionData.emoji}</View>
          <Text className={styles.summaryMood}>本月主打情绪：{mostCommonEmotionData.label}</Text>
          <Text className={styles.summaryText}>{getMoodSummary()}</Text>
        </View>

        <View className={styles.statsRow}>
          <View className={styles.statCard}>
            <Text className={styles.statNum}>{totalCheckIns}</Text>
            <Text className={styles.statLabel}>打卡天数</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={styles.statNum}>{checkInRate}%</Text>
            <Text className={styles.statLabel}>打卡率</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={styles.statNum}>{avgScore}</Text>
            <Text className={styles.statLabel}>情绪指数</Text>
          </View>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>打卡日历</Text>
          <CheckInCalendar diaries={diaries} month={month} />
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>情绪分布</Text>
          <View className={styles.card}>
            {(Object.entries(emotionCount) as [EmotionType, number][])
              .filter(([, count]) => count > 0)
              .map(([type, count]) => {
                const emotion = getEmotionByType(type);
                const percent = totalCheckIns > 0 ? Math.round(count / totalCheckIns * 100) : 0;
                return (
                  <View key={type} className={styles.emotionRow}>
                    <View className={styles.emotionInfo}>
                      <Text className={styles.emotionEmoji}>{emotion.emoji}</Text>
                      <Text className={styles.emotionName}>{emotion.label}</Text>
                    </View>
                    <View className={styles.emotionBar}>
                      <View
                        className={styles.emotionFill}
                        style={{ width: `${percent}%`, backgroundColor: emotion.color }}
                      />
                    </View>
                    <Text className={styles.emotionPercent}>{percent}%</Text>
                  </View>
                );
              })}
          </View>
        </View>

        {keywords.length > 0 && (
          <View className={styles.section}>
            <Text className={styles.sectionTitle}>本月关键词</Text>
            <View className={styles.card}>
              <View className={styles.keywords}>
                {keywords.slice(0, 10).map((kw, i) => {
                  const colors = ['#FF9B7B', '#FFD93D', '#87C8FF', '#B7E4C7', '#9B8AB8'];
                  const size = 24 + Math.min(kw.count * 3, 18);
                  return (
                    <Text
                      key={kw.word}
                      className={styles.keyword}
                      style={{ fontSize: `${size}rpx`, color: colors[i % colors.length] }}
                    >
                      {kw.word}
                    </Text>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>社区互动</Text>
          <View className={styles.card}>
            <View className={styles.interactRow}>
              <Text className={styles.interactLabel}>发布帖子</Text>
              <Text className={styles.interactValue}>{monthPosts.length} 篇</Text>
            </View>
            <View className={styles.interactRow}>
              <Text className={styles.interactLabel}>获得点赞</Text>
              <Text className={styles.interactValue}>❤️ {totalLikes} 次</Text>
            </View>
            <View className={styles.interactRow}>
              <Text className={styles.interactLabel}>获得评论</Text>
              <Text className={styles.interactValue}>💬 {totalComments} 次</Text>
            </View>
          </View>
        </View>

        {unlockedThisMonth.length > 0 && (
          <View className={styles.section}>
            <Text className={styles.sectionTitle}>本月获得勋章</Text>
            <View className={styles.badgesRow}>
              {unlockedThisMonth.map(badge => (
                <BadgeIcon key={badge.id} badge={badge} size="md" />
              ))}
            </View>
          </View>
        )}
      </View>

      <View className={styles.footer}>
        <Button id="export-btn" className={styles.exportBtn} onClick={handleExport}>
          导出PDF报告
        </Button>
      </View>
      <View style={{ height: '40rpx' }} />
    </ScrollView>
  );
};

export default MonthlyReportPage;
