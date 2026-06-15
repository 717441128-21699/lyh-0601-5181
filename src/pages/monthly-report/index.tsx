import React from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import jsPDF from 'jspdf';
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

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 20;
      let yPos = margin;

      const addText = (text: string, x: number, y: number, fontSize: number = 12, align: 'left' | 'center' | 'right' = 'left') => {
        doc.setFontSize(fontSize);
        doc.text(text, x, y, { align });
      };

      const addSectionTitle = (title: string, y: number) => {
        doc.setDrawColor(255, 155, 123);
        doc.setLineWidth(0.5);
        doc.line(margin, y - 6, pageWidth - margin, y - 6);
        addText(title, margin, y, 16);
        return y + 10;
      };

      // ========== 标题页 ==========
      doc.setFillColor(255, 248, 245);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');

      yPos = 60;
      addText('月度综合报告', pageWidth / 2, yPos, 28, 'center');
      yPos += 15;
      addText(`${month.slice(0, 4)}年${parseInt(month.slice(5))}月`, pageWidth / 2, yPos, 20, 'center');
      yPos += 15;
      addText('—— 心语日记 ——', pageWidth / 2, yPos, 14, 'center');

      yPos += 40;
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(margin, yPos - 10, pageWidth - 2 * margin, 60, 3, 3, 'F');
      addText(`${mostCommonEmotionData.emoji} 本月主打情绪：${mostCommonEmotionData.label}`, pageWidth / 2, yPos + 10, 18, 'center');
      yPos += 20;
      const summary = getMoodSummary();
      const splitSummary = doc.splitTextToSize(summary, pageWidth - 2 * margin - 20);
      doc.setFontSize(12);
      doc.text(splitSummary, pageWidth / 2, yPos + 10, { align: 'center' });

      yPos += 30;
      addText(`生成日期：${formatDate(Date.now(), 'YYYY年MM月DD日')}`, pageWidth / 2, yPos, 10, 'center');

      doc.addPage();

      // ========== 页面2：情绪分析 ==========
      yPos = margin;
      yPos = addSectionTitle('一、本月情绪分析', yPos);

      // 统计卡片
      doc.setFillColor(255, 248, 245);
      doc.roundedRect(margin, yPos, 55, 25, 2, 2, 'F');
      doc.roundedRect(margin + 60, yPos, 55, 25, 2, 2, 'F');
      doc.roundedRect(margin + 120, yPos, 55, 25, 2, 2, 'F');

      doc.setFontSize(20);
      doc.setTextColor(255, 155, 123);
      doc.text(String(totalCheckIns), margin + 27, yPos + 12, { align: 'center' });
      doc.text(`${checkInRate}%`, margin + 87, yPos + 12, { align: 'center' });
      doc.text(String(avgScore), margin + 147, yPos + 12, { align: 'center' });

      doc.setFontSize(10);
      doc.setTextColor(102, 102, 102);
      doc.text('打卡天数', margin + 27, yPos + 20, { align: 'center' });
      doc.text('打卡率', margin + 87, yPos + 20, { align: 'center' });
      doc.text('情绪指数', margin + 147, yPos + 20, { align: 'center' });
      doc.setTextColor(0, 0, 0);

      yPos += 35;

      // 情绪分布
      yPos = addSectionTitle('情绪分布', yPos);

      const emotionsWithData = (Object.entries(emotionCount) as [EmotionType, number][])
        .filter(([, count]) => count > 0);

      emotionsWithData.forEach(([type, count], i) => {
        const emotion = getEmotionByType(type);
        const percent = totalCheckIns > 0 ? Math.round(count / totalCheckIns * 100) : 0;

        // 条形图背景
        doc.setFillColor(245, 245, 245);
        doc.roundedRect(margin + 30, yPos, 110, 8, 2, 2, 'F');

        // 条形图填充
        const colorHex = emotion.color;
        const r = parseInt(colorHex.slice(1, 3), 16);
        const g = parseInt(colorHex.slice(3, 5), 16);
        const b = parseInt(colorHex.slice(5, 7), 16);
        doc.setFillColor(r, g, b);
        doc.roundedRect(margin + 30, yPos, 110 * percent / 100, 8, 2, 2, 'F');

        // 表情和标签
        addText(emotion.emoji, margin, yPos + 7, 14);
        addText(emotion.label, margin + 12, yPos + 7, 11);
        addText(`${percent}%`, margin + 145, yPos + 7, 11);

        yPos += 14;
      });

      yPos += 5;

      // 关键词
      if (keywords.length > 0) {
        yPos = addSectionTitle('本月关键词', yPos);
        doc.setFontSize(11);
        const topKeywords = keywords.slice(0, 10);
        const colors = ['#FF9B7B', '#FFD93D', '#87C8FF', '#B7E4C7', '#9B8AB8'];
        topKeywords.forEach((kw, i) => {
          const colorHex = colors[i % colors.length];
          const r = parseInt(colorHex.slice(1, 3), 16);
          const g = parseInt(colorHex.slice(3, 5), 16);
          const b = parseInt(colorHex.slice(5, 7), 16);
          doc.setTextColor(r, g, b);
          const fontSize = 12 + Math.min(kw.count * 2, 6);
          doc.setFontSize(fontSize);
          const x = margin + (i % 5) * 35;
          const yOffset = Math.floor(i / 5) * 15;
          doc.text(`${kw.word}(${kw.count})`, x, yPos + yOffset);
        });
        doc.setTextColor(0, 0, 0);
        yPos += Math.ceil(topKeywords.length / 5) * 15 + 5;
      }

      // 分页检查
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = margin;
      }

      // ========== 页面3：打卡日历 ==========
      doc.addPage();
      yPos = margin;
      yPos = addSectionTitle('二、打卡日历', yPos);

      const year = parseInt(month.slice(0, 4));
      const monthNum = parseInt(month.slice(5)) - 1;
      const firstDay = new Date(year, monthNum, 1).getDay();
      const daysInMonth = new Date(year, monthNum + 1, 0).getDate();

      const cellSize = 15;
      const startX = margin;
      const startY = yPos;

      // 星期标题
      const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      weekDays.forEach((day, i) => {
        doc.text(day, startX + i * cellSize + cellSize / 2, startY + 5, { align: 'center' });
      });
      doc.setTextColor(0, 0, 0);

      // 日期格子
      let dayCount = 1;
      const checkedDates = monthDiaries.map(d => parseInt(d.date.slice(8)));

      for (let week = 0; week < 6; week++) {
        for (let day = 0; day < 7; day++) {
          const cellX = startX + day * cellSize;
          const cellY = startY + 10 + week * cellSize;

          if ((week === 0 && day < firstDay) || dayCount > daysInMonth) {
            // 空格子
            doc.setFillColor(250, 250, 250);
            doc.roundedRect(cellX, cellY, cellSize - 1, cellSize - 1, 2, 2, 'F');
          } else {
            const isChecked = checkedDates.includes(dayCount);
            if (isChecked) {
              doc.setFillColor(255, 155, 123);
              doc.roundedRect(cellX, cellY, cellSize - 1, cellSize - 1, 2, 2, 'F');
              doc.setTextColor(255, 255, 255);
            } else {
              doc.setFillColor(255, 248, 245);
              doc.roundedRect(cellX, cellY, cellSize - 1, cellSize - 1, 2, 2, 'F');
              doc.setTextColor(102, 102, 102);
            }
            doc.setFontSize(9);
            doc.text(String(dayCount), cellX + (cellSize - 1) / 2, cellY + 10, { align: 'center' });
            doc.setTextColor(0, 0, 0);
            dayCount++;
          }
        }
      }

      yPos = startY + 10 + 6 * cellSize + 15;

      // 图例
      doc.setFillColor(255, 155, 123);
      doc.roundedRect(margin, yPos, 10, 10, 2, 2, 'F');
      addText('已打卡', margin + 15, yPos + 8, 10);
      doc.setFillColor(255, 248, 245);
      doc.roundedRect(margin + 45, yPos, 10, 10, 2, 2, 'F');
      addText('未打卡', margin + 60, yPos + 8, 10);
      yPos += 25;

      addText(`本月共打卡 ${totalCheckIns} 天，打卡率 ${checkInRate}%`, margin, yPos, 12);

      if (yPos > pageHeight - 60) {
        doc.addPage();
        yPos = margin;
      }

      // ========== 页面4：社区互动 + 勋章 ==========
      doc.addPage();
      yPos = margin;
      yPos = addSectionTitle('三、社区互动数据', yPos);

      doc.setFillColor(255, 248, 245);
      doc.roundedRect(margin, yPos, 55, 25, 2, 2, 'F');
      doc.roundedRect(margin + 60, yPos, 55, 25, 2, 2, 'F');
      doc.roundedRect(margin + 120, yPos, 55, 25, 2, 2, 'F');

      doc.setFontSize(20);
      doc.setTextColor(255, 155, 123);
      doc.text(String(monthPosts.length), margin + 27, yPos + 12, { align: 'center' });
      doc.text(String(totalLikes), margin + 87, yPos + 12, { align: 'center' });
      doc.text(String(totalComments), margin + 147, yPos + 12, { align: 'center' });

      doc.setFontSize(10);
      doc.setTextColor(102, 102, 102);
      doc.text('发布帖子', margin + 27, yPos + 20, { align: 'center' });
      doc.text('获得点赞', margin + 87, yPos + 20, { align: 'center' });
      doc.text('获得评论', margin + 147, yPos + 20, { align: 'center' });
      doc.setTextColor(0, 0, 0);

      yPos += 40;

      if (unlockedThisMonth.length > 0) {
        yPos = addSectionTitle('四、本月获得勋章', yPos);
        unlockedThisMonth.forEach((badge, i) => {
          addText(`${badge.icon} ${badge.name}`, margin, yPos + i * 12, 12);
          addText(`- ${badge.description}`, margin + 40, yPos + i * 12, 10);
        });
      }

      // 页脚
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text(`心语日记 · 第 ${i} 页 / 共 ${totalPages} 页`, pageWidth / 2, pageHeight - 15, { align: 'center' });
      }

      // 生成PDF
      const pdfOutput = doc.output('blob');
      const url = URL.createObjectURL(pdfOutput);

      Taro.hideLoading();

      // 显示成功弹窗并提供下载
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

      console.log('[PDF] 月度报告生成成功，共', totalPages, '页');

    } catch (error) {
      console.error('[PDF] 生成失败:', error);
      Taro.hideLoading();
      Taro.showToast({
        title: '生成失败，请重试',
        icon: 'none'
      });
    }
  };

  return (
    <ScrollView className={styles.page} scrollY>
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

      <View className={styles.footer}>
        <Button className={styles.exportBtn} onClick={handleExport}>
          导出PDF报告
        </Button>
      </View>
      <View style={{ height: '40rpx' }} />
    </ScrollView>
  );
};

export default MonthlyReportPage;
