-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 24, 2026 at 07:38 AM
-- Server version: 11.8.8-MariaDB-log
-- PHP Version: 7.2.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `u741728225_mindcafe`
--

-- --------------------------------------------------------

--
-- Table structure for table `category`
--

CREATE TABLE `category` (
  `id` int(11) NOT NULL,
  `category_name` varchar(150) NOT NULL,
  `current_datetime` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `category`
--

INSERT INTO `category` (`id`, `category_name`, `current_datetime`) VALUES
(1, 'Clinical Psychologist', '2023-10-17 10:47:10'),
(2, 'Counseling Psychologist', '2023-10-17 10:59:55'),
(5, 'Parenting Coach', '2023-10-17 11:01:18'),
(6, 'Storytellers', '2023-10-17 11:01:27'),
(7, 'Psychiatrist', '2023-10-17 11:01:36'),
(8, 'Happiness Coach', '2023-10-17 11:01:47'),
(9, 'Life Coach', '2023-10-17 11:01:56'),
(10, 'Spiritual Leader', '2023-10-17 11:02:04'),
(11, 'Spiritual Influencer', '2023-10-17 11:02:12'),
(12, 'Ayurveda and Hijama Practitioner ', '2023-10-17 11:02:20'),
(13, 'Yoga Trainer ', '2023-12-08 04:30:14'),
(15, 'Head Psychologist', '2024-01-25 11:58:13'),
(18, 'Celebrity Yoga Trainer', '2024-03-13 07:33:04'),
(19, 'Relationship and Leadership Coach', '2024-11-27 08:28:20'),
(20, 'CBT Focussed Care Expert', '2025-03-24 08:13:40'),
(21, 'Neural Rehab and Child Psychology Expert', '2025-03-24 08:23:19'),
(22, 'Trauma and Animal- Assisted Therapy Expert', '2025-03-24 08:23:44'),
(23, 'Group Therapy and Assessment Expert', '2025-03-24 08:23:56'),
(24, 'Mental Health Innovations Expert', '2025-03-24 08:24:07'),
(25, 'Mindfulness Expert', '2025-03-24 08:24:17'),
(26, 'Adult Counselling Expert', '2025-03-24 08:24:29'),
(27, 'Individual and Group Counselling Expert', '2025-03-24 08:24:43'),
(28, 'Childhood Emotional Neglect Expert', '2025-03-24 08:24:54'),
(29, 'Nutritionist', '2026-03-05 07:26:28');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `category`
--
ALTER TABLE `category`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `category`
--
ALTER TABLE `category`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
