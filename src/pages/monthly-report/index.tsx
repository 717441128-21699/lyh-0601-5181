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

const getPrevMonth = (month: string): string => {
  const [y, m] = month.split('-').map(Number);
  if (m === 1) return `${y - 1}-12`;
  return `${y}-${m - 1 < 10 ? '0' + (m - 1) : m - 1}`;
};

const DiffIndicator: React.FC<{ current: number; prev: number; unit?: string }> = ({ current, prev, unit = '' }) => {
  const diff = current - prev;
  if (diff === 0) return <Text className={styles.diffZero}>持平</Text>;
  if (diff > 0) return <Text className={styles.diffUp}>↑ +{diff}{unit}</Text>;
  return <Text className={styles.diffDown}>↓ {diff}{unit}</Text>;
};

const TrendArrow: React.FC<{ current: number; prev: number }> = ({ current, prev }) => {
  if (prev === 0 && current === 0) return null;
  if (current === prev) return <Text className={styles.trendArrow}>→</Text>;
  if (current > prev) return <Text className={`${styles.trendArrow} ${styles.trendArrowUp}`}>↑</Text>;
  return <Text className={`${styles.trendArrow} ${styles.trendArrowDown}`}>↓</Text>;
};

const MonthlyReportPage: React.FC = () => {
  const diaries = useDiaryStore(state => state.diaries);
  const badges = useDiaryStore(state => state.badges);
  const posts = useDiaryStore(state => state.posts);
  const reportRef = useRef<HTMLDivElement>(null);

  const month = getCurrentMonth();
  const monthDates = getMonthDates(month);
  const monthDiaries = diaries.filter(d => d.date.startsWith(month));

  const prevMonth = getPrevMonth(month);
  const prevMonthDates = getMonthDates(prevMonth);
  const prevMonthDiaries = diaries.filter(d => d.date.startsWith(prevMonth));

  const totalCheckIns = monthDiaries.length;
  const checkInRate = Math.round((totalCheckIns / monthDates.length) * 100);

  const prevTotalCheckIns = prevMonthDiaries.length;
  const prevCheckInRate = prevMonthDates.length > 0 ? Math.round((prevTotalCheckIns / prevMonthDates.length) * 100) : 0;

  const emotionCount: Record<EmotionType, number> = {
    happy: 0, calm: 0, sad: 0, anxious: 0, angry: 0, tired: 0
  };
  let totalScore = 0;
  let totalIntensity = 0;
  monthDiaries.forEach(d => {
    emotionCount[d.emotion] = (emotionCount[d.emotion] || 0) + 1;
    totalScore += getEmotionScore(d.emotion);
    totalIntensity += (d.intensity ?? 5);
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
  const avgIntensity = totalCheckIns > 0 ? (totalIntensity / totalCheckIns).toFixed(1) : '5.0';

  const prevEmotionCount: Record<EmotionType, number> = {
    happy: 0, calm: 0, sad: 0, anxious: 0, angry: 0, tired: 0
  };
  let prevTotalScore = 0;
  prevMonthDiaries.forEach(d => {
    prevEmotionCount[d.emotion] = (prevEmotionCount[d.emotion] || 0) + 1;
    prevTotalScore += getEmotionScore(d.emotion);
  });

  let prevMostCommonEmotion: EmotionType = 'calm';
  let prevMaxCount = 0;
  (Object.entries(prevEmotionCount) as [EmotionType, number][]).forEach(([type, count]) => {
    if (count > prevMaxCount) {
      prevMaxCount = count;
      prevMostCommonEmotion = type;
    }
  });

  const prevAvgScore = prevTotalCheckIns > 0 ? (prevTotalScore / prevTotalCheckIns).toFixed(1) : '0.0';

  const keywords = extractKeywords(monthDiaries.map(d => d.content));

  const monthPosts = posts.filter(p => {
    const postMonth = new Date(p.createdAt).toISOString().slice(0, 7);
    return postMonth === month;
  });
  const prevMonthPosts = posts.filter(p => {
    const postMonth = new Date(p.createdAt).toISOString().slice(0, 7);
    return postMonth === prevMonth;
  });

  const unlockedThisMonth = badges.filter(b => b.unlocked && b.unlockedAt &&
    new Date(b.unlockedAt).toISOString().slice(0, 7) === month
  );

  const totalLikes = monthPosts.reduce((sum, p) => sum + p.likes, 0);
  const totalComments = monthPosts.reduce((sum, p) => sum + p.comments, 0);
  const prevTotalLikes = prevMonthPosts.reduce((sum, p) => sum + p.likes, 0);
  const prevTotalComments = prevMonthPosts.reduce((sum, p) => sum + p.comments, 0);

  const mostCommonEmotionData = getEmotionByType(mostCommonEmotion);
  const prevMostCommonEmotionData = getEmotionByType(prevMostCommonEmotion);

  const prevMostCommonLabel = prevTotalCheckIns > 0 ? `${prevMostCommonEmotionData.emoji} ${prevMostCommonEmotionData.label}` : '无数据';

  const getMonthLabel = (m: string): string => {
    const parts = m.split('-');
    return `${parseInt(parts[1], 10)}月`;
  };

  const getMonthStats = (targetMonth: string) => {
    const targetDiaries = diaries.filter(d => d.date.startsWith(targetMonth));
    const checkIns = targetDiaries.length;
    let monthScore = 0;
    let highNegativeDays = 0;
    targetDiaries.forEach(d => {
      monthScore += getEmotionScore(d.emotion);
      const isNegative = getEmotionByType(d.emotion).isNegative;
      if (isNegative && (d.intensity ?? 5) >= 7) {
        highNegativeDays++;
      }
    });
    const avgScore = checkIns > 0 ? parseFloat((monthScore / checkIns).toFixed(1)) : 0;

    const targetPosts = posts.filter(p => {
      const postMonth = new Date(p.createdAt).toISOString().slice(0, 7);
      return postMonth === targetMonth;
    });
    const communityInteractions = targetPosts.reduce((sum, p) => sum + p.likes + p.comments, 0);

    return {
      checkIns,
      avgScore,
      highNegativeDays,
      communityInteractions
    };
  };

  const month2 = getPrevMonth(month);
  const month3 = getPrevMonth(month2);
  const trendMonths = [month3, month2, month];
  const trendData = trendMonths.map(m => ({
    month: m,
    label: getMonthLabel(m),
    stats: getMonthStats(m)
  }));

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
      if (exportBtn) exportBtn.style.display = 'none';

      await new Promise(resolve => setTimeout(resolve, 100));

      const reportElement = reportRef.current as unknown as HTMLElement;
      if (!reportElement) throw new Error('无法获取报告内容');

      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FFF8F5',
        logging: true,
        windowWidth: reportElement.scrollWidth,
        windowHeight: reportElement.scrollHeight
      });

      if (exportBtn) exportBtn.style.display = 'block';

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

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

      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(9);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`心语日记 · 月度报告 · 第 ${i} 页 / 共 ${pageCount} 页`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }

      const pdfOutput = pdf.output('blob');
      const url = URL.createObjectURL(pdfOutput);

      Taro.hideLoading();

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
                  if (r.confirm) window.open(url, '_blank');
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
      if (exportBtn) exportBtn.style.display = 'block';
      Taro.showToast({ title: '生成失败，请重试', icon: 'none' });
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
          {prevTotalCheckIns > 0 && mostCommonEmotion !== prevMostCommonEmotion && (
            <Text className={styles.summaryChange}>
              上月主打情绪：{prevMostCommonEmotionData.emoji} {prevMostCommonEmotionData.label}
            </Text>
          )}
        </View>

        <View className={styles.statsRow}>
          <View className={styles.statCard}>
            <Text className={styles.statNum}>{totalCheckIns}</Text>
            <Text className={styles.statLabel}>打卡天数</Text>
            <DiffIndicator current={totalCheckIns} prev={prevTotalCheckIns} unit="天" />
          </View>
          <View className={styles.statCard}>
            <Text className={styles.statNum}>{checkInRate}%</Text>
            <Text className={styles.statLabel}>打卡率</Text>
            <DiffIndicator current={checkInRate} prev={prevCheckInRate} unit="%" />
          </View>
          <View className={styles.statCard}>
            <Text className={styles.statNum}>{avgScore}</Text>
            <Text className={styles.statLabel}>情绪指数</Text>
            <DiffIndicator current={parseFloat(avgScore)} prev={parseFloat(prevAvgScore)} />
          </View>
        </View>

        <View className={styles.statsRow}>
          <View className={styles.statCard}>
            <Text className={styles.statNum}>{avgIntensity}</Text>
            <Text className={styles.statLabel}>平均强度</Text>
          </View>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>📊 与上月对比</Text>
          <View className={styles.card}>
            <View className={styles.compareRow}>
              <Text className={styles.compareLabel}>打卡天数</Text>
              <View className={styles.compareValues}>
                <Text className={styles.comparePrev}>{prevTotalCheckIns}天</Text>
                <Text className={styles.compareArrow}>→</Text>
                <Text className={styles.compareCurrent}>{totalCheckIns}天</Text>
                <DiffIndicator current={totalCheckIns} prev={prevTotalCheckIns} unit="天" />
              </View>
            </View>
            <View className={styles.compareRow}>
              <Text className={styles.compareLabel}>主打情绪</Text>
              <View className={styles.compareValues}>
                <Text className={styles.comparePrev}>{prevMostCommonLabel}</Text>
                <Text className={styles.compareArrow}>→</Text>
                <Text className={styles.compareCurrent}>{mostCommonEmotionData.emoji} {mostCommonEmotionData.label}</Text>
              </View>
            </View>
            <View className={styles.compareRow}>
              <Text className={styles.compareLabel}>情绪指数</Text>
              <View className={styles.compareValues}>
                <Text className={styles.comparePrev}>{prevAvgScore}</Text>
                <Text className={styles.compareArrow}>→</Text>
                <Text className={styles.compareCurrent}>{avgScore}</Text>
                <DiffIndicator current={parseFloat(avgScore)} prev={parseFloat(prevAvgScore)} />
              </View>
            </View>
            <View className={styles.compareRow}>
              <Text className={styles.compareLabel}>社区互动</Text>
              <View className={styles.compareValues}>
                <Text className={styles.comparePrev}>{prevTotalLikes + prevTotalComments}次</Text>
                <Text className={styles.compareArrow}>→</Text>
                <Text className={styles.compareCurrent}>{totalLikes + totalComments}次</Text>
                <DiffIndicator current={totalLikes + totalComments} prev={prevTotalLikes + prevTotalComments} unit="次" />
              </View>
            </View>
          </View>
        </View>

        <View className={`${styles.section} ${styles.trendSection}`}>
          <Text className={styles.sectionTitle}>📊 近3个月趋势</Text>
          <View className={styles.trendTable}>
            <View className={styles.trendRow}>
              <Text className={styles.trendLabel}></Text>
              {trendData.map((t, i) => (
                <View key={t.month} className={styles.trendMonthCell}>
                  <Text className={styles.trendMonthLabel}>{t.label}</Text>
                </View>
              ))}
            </View>
            <View className={styles.trendRow}>
              <Text className={styles.trendLabel}>打卡天数</Text>
              {trendData.map((t, i) => (
                <View key={t.month} className={styles.trendMonthCell}>
                  <Text className={`${styles.trendMonthValue} ${i === trendData.length - 1 ? styles.trendMonthValueCurrent : ''}`}>
                    {t.stats.checkIns}
                  </Text>
                  {i > 0 && <TrendArrow current={t.stats.checkIns} prev={trendData[i - 1].stats.checkIns} />}
                </View>
              ))}
            </View>
            <View className={styles.trendRow}>
              <Text className={styles.trendLabel}>平均情绪指数</Text>
              {trendData.map((t, i) => (
                <View key={t.month} className={styles.trendMonthCell}>
                  <Text className={`${styles.trendMonthValue} ${i === trendData.length - 1 ? styles.trendMonthValueCurrent : ''}`}>
                    {t.stats.avgScore.toFixed(1)}
                  </Text>
                  {i > 0 && <TrendArrow current={t.stats.avgScore} prev={trendData[i - 1].stats.avgScore} />}
                </View>
              ))}
            </View>
            <View className={styles.trendRow}>
              <Text className={styles.trendLabel}>高强度负面天数</Text>
              {trendData.map((t, i) => (
                <View key={t.month} className={styles.trendMonthCell}>
                  <Text className={`${styles.trendMonthValue} ${i === trendData.length - 1 ? styles.trendMonthValueCurrent : ''}`}>
                    {t.stats.highNegativeDays}
                  </Text>
                  {i > 0 && <TrendArrow current={t.stats.highNegativeDays} prev={trendData[i - 1].stats.highNegativeDays} />}
                </View>
              ))}
            </View>
            <View className={styles.trendRow}>
              <Text className={styles.trendLabel}>社区互动</Text>
              {trendData.map((t, i) => (
                <View key={t.month} className={styles.trendMonthCell}>
                  <Text className={`${styles.trendMonthValue} ${i === trendData.length - 1 ? styles.trendMonthValueCurrent : ''}`}>
                    {t.stats.communityInteractions}
                  </Text>
                  {i > 0 && <TrendArrow current={t.stats.communityInteractions} prev={trendData[i - 1].stats.communityInteractions} />}
                </View>
              ))}
            </View>
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
